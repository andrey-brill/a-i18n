
import { ErrorCodes, NotLoadedError, I18nError, NotResolvedError, DuplicateKeyError, UnappliedChangesError, KeyExistError, KeyNotExistError, NotUniqueI18nFilesError, InvalidKeyError, NoI18nJsFileError } from './Errors.js';
import { simpleDebounce$, safeValue$, detectLocale$, isI18nFile$, isI18nJsFile$, getTime$, unsafeValue$, commentLine$, valueLine$, deleteLine$, splitFK$, buildFK$, toBacklog$, toPromise, tCompare$, strCompare$, boolCompare$ } from './Utils.js';
import { CommentLine, ApprovedLine, NotApprovedLine, DeleteKeyLine, KeyValueSeparator, AutoExport, ManualExport, TypeFile, DefaultI18n } from './Constants.js';

import { SortedArray } from './SortedArray.js';
import { ConfigDefaults } from './ConfigDefaults.js';
import { parseLines$ } from './Ai18n.parseLines$.js';


export class Ai18n {

  constructor(config = {}) {

    this._config = Object.assign({}, ConfigDefaults, config);
    this._fs = new this._config.fs(this.__initializeFS$(), this._config);

    this.autoExport = this._config.autoExport;

    this._resetState$();

    this._actions$().forEach(actionFn => {

      const actionName = actionFn.name;
      if (actionName[0] === '_') {
        throw new Error('Invalid action: ' + actionName);
      }

      actionFn = actionFn.bind(this);
      this[actionName] = (options) => {
        console.log('call', actionName);
        return actionFn(options).catch(e => {
          console.log('catch', e);
          this._config.errorHandler(e);
        });
      }
    });
  }

  _actions$() {
    return [
      this.addFile,
      this.addKey,
      this.connect,
      this.copyKey,
      this.deleteFile,
      this.deleteKey,
      this.export,
      this.load,
      this.renameKey,
      this.revertUpdates,
      this.save,
      this.updateTranslation
    ]
  }

  __initializeFS$() {
    throw new Error('Not implemented');
  }

  _resetState$() {

    this._lastTimeUpdated = 0;

    delete this.state;

    this.state = {
      keys: new SortedArray(),
      origins: {},
      files: {}, // by locale
      locales: [],
      error: null,
      loaded: false
    };

    this._resetUpdates$();
  }

  _setFiles$(files = []) {

    const filesByLocale = {};
    for (const file of files) {
      filesByLocale[file.locale] = file;
    }

    this.state.files = filesByLocale;
    this.state.locales = Object.keys(filesByLocale);

    if (this.state.locales.length !== files.length) {
      throw new NotUniqueI18nFilesError();
    }

  }

  _resetUpdates$() {
    this.state.updates = {
      keys: new Set(),
      fullKeys: new Set(),
      before: {},
      after: {}
    };
  }

  _cloneState$() {
    return Object.assign({},
      this.state,
      {
        locales: [...this.state.locales],
        keys: {
          array: this.state.keys.array,
          changed: this.state.keys.changed
        }
      }
    );
  }

  _triggerChange$() {

    try {
      if (this._onChange$) {
        this._onChange$(this._cloneState$());
      }
    }
    catch (e) {
      this._config.errorHandler(e);
    }
    finally {
      this.state.keys.updated = false;
    }
  }

  _nameToFile$(fileName) {
    const path = this._fs.pathTo$(fileName);
    return {
      name: fileName,
      path,
      locale: detectLocale$(fileName)
    }
  }

  _validateKey$(key) {

    if (key && key.length > 0 && key.indexOf(KeyValueSeparator) === -1) {
      return true;
    }

    throw new InvalidKeyError(key);
  }

  _validateAction$(options) {

    if (typeof options === 'function') {
      throw new I18nError(ErrorCodes.InvalidOptions, `Options can't be a function.`);
    }

    if (!this.state.loaded) {
      throw new NotLoadedError();
    }

    if (this.state.error) {
      throw new NotResolvedError(this.state.error);
    }

  }

  _updateState$(locale, content) {

    const lines = parseLines$(content);

    const { keys, origins, updates } = this.state;

    const keysState = {};
    for (const parsedLine of lines) {

      const fullKey = buildFK$(locale, parsedLine.key);
      const before = updates.before[fullKey] = origins[fullKey];

      if (parsedLine.type === DeleteKeyLine) {
        delete updates.after[fullKey];
        keysState[parsedLine.key] = false;
      } else {
        // update must be immutable
        updates.after[fullKey] = Object.assign({}, before, updates.after[fullKey], parsedLine);
        keysState[parsedLine.key] = true;
      }
    }

    // same key edited several times, so making add or remove operation only once
    Object.keys(keysState).forEach(key => {
      if (keysState[key]) {
        keys.insert(key);
      } else {
        keys.remove(key);
      }
    });

  }

  _copyT$(fullKey, newT) {
    const hasUpdate = !!(this.state.updates.before[fullKey] || this.state.updates.after[fullKey]);
    return Object.assign({}, hasUpdate ? this.state.updates.after[fullKey] : this.state.origins[fullKey], newT);
  }

  _resetAllUpdates() {
    this._resetUpdates$();
    return Promise.all(this.state.files.map(file => this._fs.delete(toBacklog$(file.path))));
  }

  _updatesFKs$() {
    const updateKeys = new Set();
    Object.keys(this.state.updates.before).forEach(fullKey => updateKeys.add(fullKey));
    Object.keys(this.state.updates.after).forEach(fullKey => updateKeys.add(fullKey));
    return this.state.updates.fullKeys = updateKeys;
  }

  // removing updates if they don't change the state
  _optimizeUpdates(updates = []) {
    return Promise.all(updates)
      .then(() => {

        const notOptimizedFKs = this._updatesFKs$();
        if (notOptimizedFKs.size === 0) {
          return true;
        }

        const { before, after } = this.state.updates;

        notOptimizedFKs.forEach((fullKey) => {

          const origins = before[fullKey];
          const updated = after[fullKey];

          if (origins && updated &&
            safeValue$(origins.comment) === safeValue$(updated.comment) &&
            safeValue$(origins.value) === safeValue$(updated.value) &&
            (origins.approved || false) === (updated.approved || false)) {
            delete before[fullKey];
            delete after[fullKey];
          }
        });

        const optimizedFKs = this._updatesFKs$();
        if (notOptimizedFKs.size > 0 && optimizedFKs.size === 0) {
          return this._resetAllUpdates(); // if all updates reverted then removing backlog files
        } else {
          const keys = optimizedFKs.map(fk => splitFK$(fk)[1]);
          this.state.updates.keys = new Set(keys);
          return true;
        }
      })
      .then(() => this._triggerChange$());
  }

  _findFiles(filter$, returnFirst = false) {
    return this._fs.validateDirectory()
      .then(() => this._fs.readDirectory())
      .then((content = []) => {

        const r = content
          .filter(info => info[1] === TypeFile && filter$(info[0]))
          .map(info => this._nameToFile$(info[0]));

        return returnFirst ? r[0] : r;
      });
  }

  _findI18nFiles() { return this._findFiles(isI18nFile$); };
  _findI18nJsFile() { return this._findFiles(isI18nJsFile$, true); };

  _fileName$(locale) { return this.state.files[locale].name }

  _appendUpdate(locale, content) {
    this._updateState$(locale, content);
    return this._fs.appendContent(this._fs.pathTo$(toBacklog$(this._fileName$(locale))), content);
  }

  _autoExport() {
    if (this.autoExport) {
      return this.export({ type: AutoExport });
    } else {
      return toPromise(false);
    }
  }

  connect(options = {}) {
    return this._fs.validateDirectory()
      .then(() => {

        this._onChange$ = options.onChange;

        const ignoreChangesTimeoutMs = 1000;
        const debounceLoad = simpleDebounce$(this.load, 300); // if several updates applied at the same time

        const unsubscribe = this._fs.watch$(fileName => {

          console.log('watch change', fileName);

          if (isI18nJsFile$(fileName)) {
            return this._autoExport();
          }

          if (isI18nFile$(fileName)) {
            if (this._lastTimeUpdated + ignoreChangesTimeoutMs < getTime$()) {
              debounceLoad();
            }
          }
        });

        return () => {
          delete this._onChange$;
          unsubscribe();
        }
      });
  }

  load() {
    return toPromise(() => this._resetState$())
      .then(() => this._findI18nFiles())
      .then((files) => {

        if (files.length === 0) {
          files.push(this._nameToFile$(DefaultI18n));
        }

        this._setFiles$(files);

        const paths = files.map(file => file.path);
        const all = paths.concat(paths.map(toBacklog$));
        return Promise.all(all.map(path => this._fs.readFile(path)))
      })
      .then((contents = []) => {

        try {

          const keys = new Set();

          for (let i = 0; i < this.state.locales.length; i++) {

            const locale = this.state.locales[i];
            const valueKeys = new Set();
            const commentKeys = new Set();

            const lines = parseLines$(contents[i]);
            for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {

              const parsedLine = lines[lineNumber];

              const fullKey = buildFK$(locale, parsedLine.key);

              this.state.origins[fullKey] = Object.assign(this.state.origins[fullKey] || {}, parsedLine);

              const targetSet = parsedLine.type === CommentLine ? commentKeys : valueKeys;

              if (targetSet.has(parsedLine.key)) {
                throw new DuplicateKeyError(parsedLine.key + ` [${this._fileName$(locale)}:${lineNumber}]`);
              } else {
                keys.add(parsedLine.key);
                targetSet.add(parsedLine.key);
              }
            }

          }


          // must be set before updates
          this.state.keys.array = Array.from(keys.values());

          this._resetUpdates$();

          // updates must be applied
          const backlogOffset = this.state.locales.length;
          for (let fi = 0; fi < backlogOffset; fi++) {
            const locale = this.state.locales[fi];
            const backlog = contents[backlogOffset + fi];
            this._updateState$(locale, backlog);
          }

        } catch (e) {
          if (e.stateError) {
            this.state.error = e;
          } else {
            throw e;
          }
        }
        finally {
          this.state.loaded = true;
        }

        return this._optimizeUpdates();
      })
  }

  // important to make updates to local files under development
  // save state to fs (current state - with updates)
  save() {
    return toPromise(() => {

      this._lastTimeUpdated = getTime$();

      const files = Object.values(this.state.files)
        .map(file => Object.assign({}, file, {
          lines: [],
          t: undefined
        }));

      const { origins, updates } = this.state;

      // committing updates
      const updateKeys = this._updatesFKs$();
      for (const ufk of updateKeys) {
        const after = updates.after[ufk];
        if (after) {
          origins[ufk] = after;
        } else {
          delete origins[ufk];
        }
      }

      for (const key of this.state.keys.array) {

        let hasComment = false;
        let hasValue = false;

        for (const file of files) {
          const fullKey = buildFK$(file.locale, key);
          const t = this.state.origins[fullKey] || {};
          hasComment = hasComment || (t.comment && t.comment.length > 0);
          hasValue = hasValue || (t.value && t.value.length > 0);
          file.t = t;
        }

        for (const file of files) {

          const { approved = false, value = '', comment = '' } = file.t;

          if (hasComment) {
            file.lines.push(CommentLine + key + KeyValueSeparator + comment);
          }

          if (hasComment || hasValue) {
            file.lines.push((approved ? ApprovedLine : NotApprovedLine) + key + KeyValueSeparator + value);
          }
        }

      }

      return files;
    })
      .then(files => {

        this._lastTimeUpdated = getTime$();

        return Promise.all(files.map(file => {

          file.lines.push(''); // adding empty line in the end

          return this._fs.writeFile(file.path, file.lines.join('\n'))
            .then(() => this._lastTimeUpdated = getTime$());

        }))
      })
      .catch(e => {

        const { origins, updates } = this.state;

        // rollback updates
        const updateKeys = this._updatesFKs$();
        for (const ufk of updateKeys) {
          const before = updates.before[ufk];
          if (before) {
            origins[ufk] = before;
          } else {
            delete origins[ufk];
          }
        }

        throw e;
      })
      .then(() => {
        this._lastTimeUpdated = getTime$();
        return this._resetAllUpdates()
      })
      .then(() => this._autoExport());
  }

  export(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const exporter = {

        options,
        type: options.type || ManualExport,
        fs: this._fs,
        config: this._config,

        validate: () => true,
        end: () => true
      };

      if (this._config.exporter) {
        return toPromise(Object.assign(exporter, this._config.exporter));
      } else {
        return this._findI18nJsFile()
          .then((exporterFile) => {

            if (!exporterFile) {

              if (options.type !== AutoExport) {
                throw new NoI18nJsFileError();
              }

              return toPromise(false);
            }

            return this._fs.readFile(exporterFile.path)
              .then(content => {

                function init() {
                  eval(content);
                };

                init = init.bind(exporter);

                init();

                return toPromise(exporter);
              });
          })
      }
    })
      .then((exporter) => {

        if (!exporter) {
          return false;
        }

        // don't spread exporter, as it can miss this-context
        if (!exporter.validate(this.state)) {
          return false;
        }

        for (const file of Object.values(this.state.files)) {

          const fileData = exporter.begin(file);
          for (const key of this.state.keys.array) {

            const t = this.state.origins[buildFK$(file.locale, key)];
            if (t) {

              const unsafeT = Object.assign({}, t, {
                value: unsafeValue$(t.value),
                comment: unsafeValue$(t.comment)
              })

              exporter.insert(fileData, unsafeT);
            }
          }

          exporter.end(file);
        }

        return exporter.save();
      })
      .then(exportResult => {

        if (exportResult) {
          this._config.exportHandler(exportResult, false);
          return true;
        }

        return false;
      })
      .catch(e => this._config.exportHandler(e, true) && false)
  }

  addFile(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      if (this.state.updates.keys.size > 0) {
        throw new UnappliedChangesError();
      }

      const { fileName = '' } = options;
      if (fileName.length <= 0) {
        throw new I18nError(ErrorCodes.InvalidFile, `File name can't be empty`);
      }

      const file = this._nameToFile$(fileName)
      if (this.files[fileName] || this.locales.indexOf(file.locale) >= 0) {
        return true;
      }

      const files = Object.values(this.state.files);
      files.push(file);

      this._setFiles$(files);
      return this.save();
    });
  }

  deleteFile(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { fileName = '' } = options;

      if (this.state.updates.keys.size > 0) {
        throw new UnappliedChangesError();
      }

      const file = this.state.files[fileName];
      if (!file) {
        return true;
      }

      return this._fs
        .delete(file.path)
        .then(() => this._fs.delete(toBacklog$(file.path)))
        .then(() => {
          delete this.state.files[fileName];
          this._setFiles$(Object.values(this.state.files));
          return true;
        });
    })
  }

  addKey(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { key } = options;
      this._validateKey$(key);

      const sortedIndex = this.state.keys.sortedIndexOf(key);
      if (sortedIndex >= 0) {
        throw new KeyExistError(key);
      }

      this.state.keys.insert(key, sortedIndex);
      const updates = this.state.locales.map(locale => this.updateTranslation({ locale, key, value: '' }));
      return Promise.all(updates);
    });
  }

  copyKey(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { fromKey, toKey } = options;
      if (fromKey === toKey) {
        return true;
      }

      this._validateKey$(fromKey);
      this._validateKey$(toKey);


      if (!this.state.keys.has(fromKey)) {
        throw new KeyNotExistError(fromKey);
      }

      const sortedIndex = this.state.keys.sortedIndexOf(toKey);
      if (sortedIndex >= 0) {
        throw new KeyExistError(toKey);
      }

      this.state.keys.insert(toKey, sortedIndex);

      const updates = this.state.locales.map(locale => {
        const fullKey = buildFK$(locale, fromKey);
        const newT = this._copyT$(fullKey, { locale, key: toKey });
        return this.updateTranslation(newT);
      });

      return Promise.all(updates);
    });
  }

  renameKey(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { fromKey, toKey } = options;
      if (fromKey === toKey) {
        return;
      }

      this._validateKey$(fromKey);
      this._validateKey$(toKey);

      return this.copyKey({ fromKey, toKey })
        .then(() => this.deleteKey({ fromKey }));
    });
  }

  deleteKey(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { key } = options;
      this._validateKey$(key);

      if (this.state.keys.remove(key)) {

        const updates = this.state.locales.map(locale => this._appendUpdate(locale, deleteLine$(key)));
        return this._optimizeUpdates(updates);
      }
    });
  }

  updateTranslation(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { locale, key, value, comment, approved = false } = options;
      this._validateKey$(key);

      const current = this._copyT$(buildFK$(locale, key));

      const valueCompare = strCompare$(value, current.value) && boolCompare$(approved, current.approved);
      const commentCompare = strCompare$(comment, current.comment);

      if (valueCompare && commentCompare) {
        return true;
      }

      let update = null;

      if (valueCompare && !commentCompare) {
        update = commentLine$(key, comment);
      } else if (!valueCompare && commentCompare) {
        update = valueLine$(approved, key, value);
      } else {
        update = commentLine$(key, comment) + '\n' + valueLine$(approved, key, value);
      }

      return this._optimizeUpdates([this._appendUpdate(locale, update)]);
    });
  }

  revertUpdates(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { locale, key } = options;
      const updateKeys = this._updatesFKs$();
      if (updateKeys.size === 0) {
        return;
      }

      if (!locale && !key) {
        return this._resetAllUpdates();
      }

      const updates = [];

      for (const fullKey of updateKeys) {

        const [localeFK, keyFK] = splitFK$(fullKey);

        const sameFileName = locale === localeFK;
        const sameKey = key === keyFK;

        if (
          (locale && key && (!sameFileName || !sameKey)) ||
          (locale && !key && !sameFileName) ||
          (!locale && key && !sameKey)
        ) {
          return;
        }

        const t = this.state.origins[fullKey];
        const update = t ? commentLine$(keyFK, t.comment) + '\n' + valueLine$(t.approved, keyFK, t.comment) : deleteLine$(keyFK);
        updates.push(this._appendUpdate(localeFK, update));
      };

      return this._optimizeUpdates(updates);
    });
  }

}
