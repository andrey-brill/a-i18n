
import { ErrorCodes, InvalidLineError, NotLoadedError, I18nError, NotResolvedError, DuplicateKeyError, UnappliedChangesError, KeyExistError, KeyNotExistError, InvalidDirectoryError, NoI18nFilesError, InvalidKeyError, ExportError, NoI18nJsFileError } from './Errors.js';
import { simpleDebounce$, safeValue$, detectLocale$, isI18nFile$, isI18nJsFile$, getTime$, unsafeValue$, commentLine$, valueLine$, deleteLine$, splitFK$, buildFK$, toBacklog$, toPromise } from './Utils.js';
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
      this.updateApproved,
      this.updateComment,
      this.updateTranslation,
      this.updateValue
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
      updates: undefined,
      updated: {},
      origins: {},
      files: [],
      error: null,
      loaded: false
    };

    this._resetUpdates$();
  }

  _resetUpdates$() {

    this.state.updates = {
      length: 0,
      before: {},
      after: {}
    };

    // needed to make possible save without reloading
    this.state.updated = Object.assign({}, this.state.origins);
  }

  _cloneState$() {
    return Object.assign({},
      this.state,
      {
        files: [...this.state.files],
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
      return;
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


  _updateState$(fileName, content) {

    const lines = parseLines$(content);

    const { keys, origins, updates, updated } = this.state;

    const keysState = {};
    for (const parsedLine of lines) {

      const fullKey = buildFK$(fileName, parsedLine.key);

      updates.length++;
      updates.before[fullKey] = origins[fullKey];

      if (parsedLine.type === DeleteKeyLine) {
        delete updates.after[fullKey];
        delete updated[fullKey];
        keysState[parsedLine.key] = false;
      } else {
         // order important, updated values should be immutable (as they can be link to origins)
        const translation = Object.assign({}, updated[fullKey], parsedLine);
        updated[fullKey] = translation;
        updates.after[fullKey] = translation;
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
    })

  }

  _resetAllUpdates() {
    this._resetUpdates$();
    return Promise.all(this.state.files.map(file => this._fs.delete(toBacklog$(file.path))));
  }

  _updateKeys$() {
    const updateKeys = new Set();
    Object.keys(this.state.updates.before).forEach(fullKey => updateKeys.add(fullKey));
    Object.keys(this.state.updates.after).forEach(fullKey => updateKeys.add(fullKey));
    return updateKeys;
  }

  // removing updates if they don't change the state
  _optimizeUpdates(updates = []) {
    return Promise.all(updates)
      .then(() => {
        const updateKeys = this._updateKeys$();
        if (updateKeys.size === 0) {
          return true;
        }

        updateKeys.forEach((fullKey) => {

          const origins = this.state.origins[fullKey];
          const updated = this.state.updated[fullKey];

          if (origins && updated &&
            safeValue$(origins.comment) === safeValue$(updated.comment) &&
            safeValue$(origins.value) === safeValue$(updated.value) &&
            (origins.approved || false) === (updated.approved || false)) {
            delete this.state.updates.before[fullKey];
            delete this.state.updates.after[fullKey];
          }
        });

        const optimizedKeys = this._updateKeys$();
        this.state.updates.length = optimizedKeys.size;

        if (updateKeys.size > 0 && optimizedKeys.size === 0) {
          return this._resetAllUpdates(); // if all updates reverted then removing backlog files
        } else {
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

  _appendUpdate(fileName, line) {
    this._updateState$(fileName, line);
    return this._fs.appendLine(this._fs.pathTo$(toBacklog$(fileName)), line);
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

        this.state.files = files;

        const paths = files.map(file => file.path);
        const all = paths.concat(paths.map(toBacklog$));
        return Promise.all(all.map(path => this._fs.readFile(path)))
      })
      .then((contents = []) => {

        try {

          const keys = new Set();

          for (let fi = 0; fi < this.state.files.length; fi++) {

            const file = this.state.files[fi];
            const valueKeys = new Set();
            const commentKeys = new Set();

            const lines = parseLines$(contents[fi]);
            for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {

              const parsedLine = lines[lineNumber];

              const fullKey = buildFK$(file.name, parsedLine.key);

              const translation = Object.assign(this.state.origins[fullKey] || {}, parsedLine);
              this.state.origins[fullKey] = translation

              const targetSet = parsedLine.type === CommentLine ? commentKeys : valueKeys;

              if (targetSet.has(parsedLine.key)) {
                throw new DuplicateKeyError(parsedLine.key + ` [${file.name}:${lineNumber}]`);
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
          const backlogOffset = this.state.files.length;
          for (let fi = 0; fi < this.state.files.length; fi++) {
            const file = this.state.files[fi];
            const backlog = contents[backlogOffset + fi];
            this._updateState$(file.name, backlog);
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

      const files = this.state.files.map(file => Object.assign({}, file, {
        lines: [],
        t: undefined
      }));

      for (const key of this.state.keys.array) {

        let hasComment = false;
        let hasValue = false;

        for (const file of files) {
          const fullKey = buildFK$(file.name, key);
          const t = this.state.updated[fullKey] || {};
          hasComment = hasComment || (t.comment && t.comment.trim().length > 0);
          hasValue = hasValue || (t.value && t.value.trim().length > 0);
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
      .then(() => {
        this._lastTimeUpdated = getTime$();
        this.state.origins = this.state.updated;
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

        for (const file of this.state.files) {

          const fileData = exporter.begin(file);
          for (const key of this.state.keys.array) {

            const t = this.state.origins[buildFK$(file.name, key)];
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

      if (this.state.updates.length) {
        throw new UnappliedChangesError();
      }

      const { fileName = '' } = options;
      if (fileName.length <= 0) {
        throw new I18nError(ErrorCodes.InvalidFile, `File name can't be empty`);
      }

      if (this.state.files.some(file => file.name === fileName)) {
        throw new I18nError(ErrorCodes.InvalidFile, `File with name "${fileName}" already exist`);
      }

      const file = this._nameToFile$(fileName);
      this.state.files.push(file);
      return this.save();
    });
  }

  deleteFile(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { fileName = '' } = options;

      if (this.state.updates.length) {
        throw new UnappliedChangesError();
      }

      const file = this.state.files.filter(f => f.name === fileName);
      if (!file) {
        return true;
      }

      return this._fs
        .delete(file.path)
        .then(() => this._fs.delete(toBacklog$(file.path)))
        .then(() => {
          this.state.files = this.state.files.filter(f => f !== file)
          return this.save();
        });
    })
  }

  addKey(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { key } = options;
      this._validateKey$(key);

      const sortedIndex = this.state.keys.sortedIndexOf(key);
      if (sortedIndex === -1) {
        throw new KeyExistError(key);
      }

      this.state.keys.insert(key, sortedIndex);
      const updates = this.state.files.map(file => this.updateValue({ fileName: file.name, key }));
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

      if (this.state.keys.indexOf(fromKey) === -1) {
        throw new KeyNotExistError(fromKey);
      }

      const sortedIndex = this.state.keys.sortedIndexOf(toKey);
      if (sortedIndex === -1) {
        throw new KeyExistError(toKey);
      }

      this.state.keys.insert(toKey, sortedIndex);

      const updates = this.state.files.map(file => {
        const fullKey = buildFK$(file.name, fromKey);
        return this.updateTranslation(Object.assign({ fileName: file.name, key: toKey }, this.state.updated[fullKey]));
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

        const updates = this.state.files.map(file => this._appendUpdate(file.name, deleteLine$(key)));
        return this._optimizeUpdates(updates);
      }
    });
  }

  updateValue(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { fileName, key, value = '' } = options;
      this._validateKey$(key);

      const updates = [this._appendUpdate(fileName, valueLine$(false, key, value))];
      return this._optimizeUpdates(updates);
    });
  }

  updateApproved(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { fileName, key, approved = false } = options;
      this._validateKey$(key);

      const fileNames = [];
      if (fileName) {
        fileNames.push(fileName);
      } else {
        fileNames = this.state.files.map(f => f.name);
      }

      const updates = fileNames.map(fileName => {
        const value = this.state.updated[buildFK$(fileName, key)]?.value;
        return this._appendUpdate(fileName, valueLine$(approved, key, value));
      })

      return this._optimizeUpdates(updates);
    });
  }

  updateComment(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { fileName, key, comment } = options;
      this._validateKey$(key);

      const updates = [this._appendUpdate(fileName, commentLine$(key, comment))];
      return this._optimizeUpdates(updates);
    });
  }

  updateTranslation(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { fileName, key, value, comment, approved = false } = options;
      this._validateKey$(key);

      const updates = [
        this._appendUpdate(fileName, commentLine$(key, comment)).then(() => {
          this._appendUpdate(fileName, valueLine$(approved, key, value))
        })
      ];

      return this._optimizeUpdates(updates);
    });
  }

  revertUpdates(options = {}) {
    return toPromise(() => {

      this._validateAction$(options);

      const { fileName, key } = options;
      const updateKeys = this._updateKeys$();
      if (updateKeys.size === 0) {
        return;
      }

      if (!fileName && !key) {
        return this._resetAllUpdates();
      }

      const updates = [];

      for (const fullKey of updateKeys) {

        const [fileNameFK, keyFK] = splitFK$(fullKey);

        const sameFileName = fileName === fileNameFK;
        const sameKey = key === keyFK;

        if (
          (fileName && key && (!sameFileName || !sameKey)) ||
          (fileName && !key && !sameFileName) ||
          (!fileName && key && !sameKey)
        ) {
          return;
        }

        const origins = this.state.origins[fullKey];
        if (origins) {
          updates.push(this._appendUpdate(fileNameFK, commentLine$(keyFK, origins.comment)));
          updates.push(this._appendUpdate(fileNameFK, valueLine$(origins.approved, keyFK, origins.comment)));
        } else {
          updates.push(this._appendUpdate(fileNameFK, deleteLine$(keyFK)));
        }

      };

      return this._optimizeUpdates(updates);
    });
  }

}
