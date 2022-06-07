
import { ErrorCodes, NotLoadedError, I18nError, NotResolvedError, DuplicateKeyError, UnappliedChangesError, KeyExistError, KeyNotExistError, NotUniqueI18nFilesError, InvalidKeyError, NoI18nJsFileError } from './Errors.js';
import { simpleDebounce, detectLocale, isI18nFile, isI18nJsFile, getTime, unsafeValue, commentLine, valueLine, deleteLine, splitFK, buildFK, toBacklog, toPromise, strCompare, boolCompare, tCompare } from './Utils.js';
import { CommentLine, ApprovedLine, NotApprovedLine, DeleteLine, KeyValueSeparator, AutoExport, ManualExport, TypeFile, DefaultI18n, KeyState, EmptyT } from './Constants.js';

import { SortedArray } from './SortedArray.js';
import { ConfigDefaults } from './ConfigDefaults.js';
import { parseLines } from './Ai18n.parseLines.js';


export class Ai18n {

  constructor(config = {}) {

    this._config = Object.assign({}, ConfigDefaults, config);
    this._fs = new this._config.fs(this.__initializeFS(), this._config);

    this.autoExport = this._config.autoExport;

    this._resetState();

    this._actions().forEach(actionFn => {

      const actionName = actionFn.name;
      if (actionName[0] === '_') {
        throw new Error('Invalid action: ' + actionName);
      }

      actionFn = actionFn.bind(this);
      this[actionName] = (options) => {
        console.log('call ', actionName, JSON.stringify(options || {}));
        return actionFn(options).catch(e => {
          this._config.errorHandler(e);
        });
      }
    });
  }

  _actions() {
    return [
      this.connect,
      this.load,
      this.save,
      this.export,
      this.addKey,
      this.copyKey,
      this.deleteKey,
      this.applyChange,
      this.revertChanges
    ]
  }

  __initializeFS() {
    throw new Error('Not implemented');
  }

  _resetState() {

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

    this._resetChanges();
  }

  _setFiles(files = []) {

    const filesByLocale = {};
    for (const file of files) {

      const existingFile = filesByLocale[file.locale];
      if (existingFile) {
        throw new NotUniqueI18nFilesError(existingFile.name, file.name);
      }

      filesByLocale[file.locale] = file;
    }

    this.state.files = filesByLocale;
    this.state.locales = files.map(f => f.locale); // order is important
  }

  _resetChanges() {
    this.state.changes = {
      keys: new Set(),
      fullKeys: new Set(),
      before: {},
      after: {}
    };
  }

  _triggerChange() {

    try {
      if (this._onChange) {
        this._onChange();
      }
    }
    catch (e) {
      this._config.errorHandler(e);
    }
    finally {
      this.state.keys.changed = false;
    }
  }

  _nameToFile(fileName) {
    const path = this._fs.pathTo(fileName);
    return {
      name: fileName,
      path,
      locale: detectLocale(fileName)
    }
  }

  _validateKey(key) {

    if (key && key.length > 0 && key.indexOf(KeyValueSeparator) === -1) {
      return true;
    }

    throw new InvalidKeyError(key);
  }

  _validateAction(options) {

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

  _changeState(nextChanges) {

    const { keys, origins, changes } = this.state;

    const keyStates = [];
    for (const locale of Object.keys(nextChanges)) {

      const lines = parseLines(nextChanges[locale]);

      const localeKeysState = {};
      for (const parsedLine of lines) {

        const fullKey = buildFK(locale, parsedLine.key);
        const before = changes.before[fullKey] = origins[fullKey];

        if (parsedLine.type === DeleteLine) {
          delete changes.after[fullKey];
          localeKeysState[parsedLine.key] = false;
        } else {
          // change must be immutable
          changes.after[fullKey] = Object.assign({}, before, changes.after[fullKey], parsedLine);
          localeKeysState[parsedLine.key] = true;
        }
      }

      keyStates.push(localeKeysState);
    }

    // making sure if key was deleted and added after it shows as added / changed
    const joinedState = {};
    for (const ks of keyStates) {
      for (const key of Object.keys(ks)) {
        joinedState[key] = joinedState[key] === undefined ? ks[key] : ks[key] || joinedState[key]
      }
    }

    // same key edited several times, so making add or remove operation only once for all locales
    Object.keys(joinedState).forEach(key => {
      if (joinedState[key]) {
        keys.insert(key);
      } else {
        keys.remove(key);
      }
    });

  }

  getT(fullKey) {
    return this.state.changes.fullKeys.has(fullKey) ? this.state.changes.after[fullKey] : this.state.origins[fullKey];
  }

  _resetAllUpdates() {
    this._resetChanges();
    return Promise.all(Object.values(this.state.files).map(file => this._fs.deleteFile(toBacklog(file.path))));
  }

  _changesFKs() {
    const changesKeys = new Set();
    Object.keys(this.state.changes.before).forEach(fullKey => changesKeys.add(fullKey));
    Object.keys(this.state.changes.after).forEach(fullKey => changesKeys.add(fullKey));
    return this.state.changes.fullKeys = changesKeys;
  }

  _applyNextChanges(nextChanges = {}) {

    this._changeState(nextChanges);

    const changes = Object.keys(nextChanges)
      .map(locale => this._fs.appendContent(this._fs.pathTo(toBacklog(this._fileName(locale))), nextChanges[locale]));

    return Promise.all(changes)
      .then(() => {

        const notOptimizedFKs = this._changesFKs();
        console.log('notOptimizedFKs', notOptimizedFKs.size);
        if (notOptimizedFKs.size === 0) {
          return true;
        }

        const { before, after } = this.state.changes;

        notOptimizedFKs.forEach((fullKey) => {

          if (tCompare(before[fullKey], after[fullKey])) {
            delete before[fullKey];
            delete after[fullKey];
            console.log('DELETE', fullKey)
          }
        });

        const optimizedFKs = this._changesFKs();
        console.log('optimizedFKs', optimizedFKs.size);
        if (notOptimizedFKs.size > 0 && optimizedFKs.size === 0) {
          return this._resetAllUpdates(); // if all changes reverted then removing backlog files
        } else {

          const keys = new Set();
          for (const fk of optimizedFKs) {
            keys.add(splitFK(fk)[1]);
          }

          this.state.changes.keys = keys;
          return true;
        }
      })
      .then(() => this._triggerChange());
  }

  _findFiles(filter, returnFirst = false) {
    return this._fs.validateDirectory()
      .then(() => this._fs.readDirectory())
      .then((content = []) => {

        const r = content
          .filter(info => info[1] === TypeFile && filter(info[0]))
          .map(info => this._nameToFile(info[0]));

        return returnFirst ? r[0] : r;
      });
  }

  _findI18nFiles() { return this._findFiles(isI18nFile); };
  _findI18nJsFile() { return this._findFiles(isI18nJsFile, true); };

  _fileName(locale) { return this.state.files[locale].name }

  _autoExport() {
    if (this.autoExport) {
      return this.export({ type: AutoExport });
    } else {
      return toPromise(false);
    }
  }

  _tryChangeState(fn, a, b, c) {

    try {
      fn.call(this, a, b, c);
    } catch (e) {

      if (e.stateError) {

        this.state.error = {
          code: e.code,
          message: e.message
        };

        return false;
      } else {
        throw e;
      }
    }
    finally {
      this.state.loaded = true;
    }

    return true;
  }

  _prepareContentPaths(files = [], paths) {

    if (files.length === 0) {
      files.push(this._nameToFile(DefaultI18n));
    }

    this._setFiles(files);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      paths[i] = file.path;
      paths[i + files.length] = toBacklog(file.path);
    }

  }

  _parseContents(contents = []) {

      const keys = new Set();

      for (let i = 0; i < this.state.locales.length; i++) {

        const locale = this.state.locales[i];
        const valueKeys = new Set();
        const commentKeys = new Set();

        const lines = parseLines(contents[i]);

        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {

          const parsedLine = lines[lineNumber];

          const fullKey = buildFK(locale, parsedLine.key);

          this.state.origins[fullKey] = Object.assign(this.state.origins[fullKey] || {}, parsedLine);

          const targetSet = parsedLine.type === CommentLine ? commentKeys : valueKeys;

          if (targetSet.has(parsedLine.key)) {
            throw new DuplicateKeyError(parsedLine.key + ` [${this._fileName(locale)}:${lineNumber}]`);
          } else {
            keys.add(parsedLine.key);
            targetSet.add(parsedLine.key);
          }
        }

      }

      // must be set before changes
      this.state.keys.array = Array.from(keys.values());

      this._resetChanges();

      // changes must be applied at the end
      const backlogOffset = this.state.locales.length;
      const nextChanges = {};

      for (let fi = 0; fi < backlogOffset; fi++) {
        const locale = this.state.locales[fi];
        const backlog = contents[backlogOffset + fi];
        nextChanges[locale] = backlog;
      }

      this._changeState(nextChanges);
  }

  getKeyState(key) {

    const { keys, locales, changes } = this.state;

    if (!keys.has(key)) {
      return changes.keys.has(key) ? KeyState.Deleted : KeyState.Missing;
    }

    if (!changes.keys.has(key)) {
      return KeyState.Original;
    }

    for (const locale of locales) {

      const fk = buildFK(locale, key);
      if (changes.before[fk]) return KeyState.Changed;
    }

    return KeyState.New;
  }

  getKeyInfo(key) {

    const { locales, changes, origins } = this.state;

    const state = this.getKeyState(key);

    if (state === KeyState.Missing) {
      return { state };
    }

    const previous = {}, current = {};

    for (const locale of locales) {

      const fk = buildFK(locale, key);

      const before = changes.before[fk];
      const after = changes.after[fk];

      if (before || after) {
        previous[locale] = before;
        current[locale] = after || EmptyT;
      } else {
        previous[locale] = current[locale] = origins[fk] || EmptyT;
      }
    }

    return {
      state,
      previous,
      current
    }
  }

  connect(options = {}) {
    return this._fs.validateDirectory()
      .then(() => {

        this._onChange = options.onChange;

        const ignoreChangesTimeoutMs = 1000;
        const debounceLoad = simpleDebounce(this.load, 300); // if several changes applied at the same time

        const unsubscribe = this._fs.watch(fileName => {

          if (isI18nJsFile(fileName)) {
            return this._autoExport();
          }

          if (isI18nFile(fileName)) {
            if (this._lastTimeUpdated + ignoreChangesTimeoutMs < getTime()) {
              debounceLoad();
            }
          }
        });

        return () => {
          delete this._onChange;
          unsubscribe();
        }
      });
  }

  load() {
    return toPromise(() => {
      this._resetState();
      this._triggerChange();
    })
      .then(() => this._findI18nFiles())
      .then((files) => {
        const paths = [];
        if (this._tryChangeState(this._prepareContentPaths, files, paths)) {
          return Promise.all(paths.map(path => this._fs.readFile(path)))
            .then(contents => this._tryChangeState(this._parseContents, contents));
        }
      })
      .then(() => {
        if (!this.state.error) {
          return this._applyNextChanges();
        } else {
          this._triggerChange();
        }
      })
  }

  // important to make changes to local files under development
  // save state to fs (current state - with changes)
  save() {
    return toPromise(() => {

      this._lastTimeUpdated = getTime();

      const files = Object.values(this.state.files)
        .map(file => Object.assign({}, file, {
          lines: [],
          t: undefined
        }));

      const { origins, changes } = this.state;

      // committing changes
      const changesKeys = this._changesFKs();
      for (const ufk of changesKeys) {
        const after = changes.after[ufk];
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
          const fullKey = buildFK(file.locale, key);
          const t = this.state.origins[fullKey] || EmptyT;
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

        this._lastTimeUpdated = getTime();

        return Promise.all(files.map(file => {

          file.lines.push(''); // adding empty line in the end

          return this._fs.writeFile(file.path, file.lines.join('\n'))
            .then(() => this._lastTimeUpdated = getTime());

        }))
      })
      .catch(e => {

        const { origins, changes } = this.state;

        // rollback changes
        const changesKeys = this._changesFKs();
        for (const ufk of changesKeys) {
          const before = changes.before[ufk];
          if (before) {
            origins[ufk] = before;
          } else {
            delete origins[ufk];
          }
        }

        throw e;
      })
      .then(() => {
        this._lastTimeUpdated = getTime();
        return this._resetAllUpdates()
      })
      .then(() => {
        this._triggerChange();
        this._autoExport();
      });
  }

  export(options = {}) {
    return toPromise(() => {

      this._validateAction(options);

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

            const t = this.state.origins[buildFK(file.locale, key)];
            if (t) {

              const unsafeT = Object.assign({}, t, {
                value: unsafeValue(t.value),
                comment: unsafeValue(t.comment)
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

  addKey(options = {}) {
    return toPromise(() => {

      this._validateAction(options);

      const { key } = options;
      this._validateKey(key);

      const sortedIndex = this.state.keys.sortedIndexOf(key);
      if (sortedIndex >= 0) {
        throw new KeyExistError(key);
      }

      this.state.keys.insert(key, sortedIndex);

      const nextChanges = {};
      for (const locale of this.state.locales) {
        nextChanges[locale] = valueLine(EmptyT.approved, key, EmptyT.value);
      }

      return this._applyNextChanges(nextChanges);
    });
  }

  copyKey(options = {}) {
    return toPromise(() => {

      this._validateAction(options);

      const { fromKey, toKey } = options;
      if (fromKey === toKey) {
        return true;
      }

      this._validateKey(fromKey);
      this._validateKey(toKey);


      if (!this.state.keys.has(fromKey)) {
        throw new KeyNotExistError(fromKey);
      }

      const sortedIndex = this.state.keys.sortedIndexOf(toKey);
      if (sortedIndex >= 0) {
        throw new KeyExistError(toKey);
      }

      this.state.keys.insert(toKey, sortedIndex);

      const nextChanges = {};

      for (const locale of this.state.locales) {

        const fullKey = buildFK(locale, fromKey);
        const t = this.getT(fullKey);

        if (t) {
          let changes = [];
          if (t.comment) {
            changes.push(commentLine(toKey, t.comment))
          }
          changes.push(valueLine(t.approved, toKey, t.value))
          nextChanges[locale] = changes.join('\n');
        } else {
          nextChanges[locale] = valueLine(false, toKey, '');
        }

      };

      return this._applyNextChanges(nextChanges);
    });
  }

  deleteKey(options = {}) {
    return toPromise(() => {

      this._validateAction(options);

      const { key } = options;
      this._validateKey(key);

      if (this.state.keys.remove(key)) {

        const nextChanges = {};
        for (const locale of this.state.locales) {
          nextChanges[locale] = deleteLine(key);
        }

        return this._applyNextChanges(nextChanges);
      }
    });
  }

  applyChange(options = {}) {
    return toPromise(() => {

      this._validateAction(options);

      const { locale, key, value, comment, approved = false } = options;
      this._validateKey(key);

      const current = this.getT(buildFK(locale, key)) || {};

      const valueCompare = strCompare(value, current.value) && boolCompare(approved, current.approved);
      const commentCompare = strCompare(comment, current.comment);

      if (valueCompare && commentCompare) {
        return true;
      }

      let changes = [];
      if (!commentCompare) {
        changes.push(commentLine(key, comment))
      }

      if (!valueCompare) {
        changes.push(valueLine(approved, key, value))
      }

      const nextChanges = {
        [locale]: changes.join('\n')
      };

      return this._applyNextChanges(nextChanges);
    });
  }

  revertChanges(options = {}) {
    return toPromise(() => {

      this._validateAction(options);

      const { locale, key } = options;
      const changesKeys = this._changesFKs();
      if (changesKeys.size === 0) {
        return;
      }

      if (!locale && !key) {
        return this._resetAllUpdates()
          .then(() => this._triggerChange());
      }

      const nextChanges = {};

      for (const fullKey of changesKeys) {

        const [localeFK, keyFK] = splitFK(fullKey);

        const sameLocale = (locale === localeFK) || !locale;
        const sameKey = (key === keyFK) || !key;

        if (sameLocale && sameKey) {

          console.log('revert', fullKey);
          const t = this.state.origins[fullKey];
          const change = t ? commentLine(keyFK, t.comment) + '\n' + valueLine(t.approved, keyFK, t.value) : deleteLine(keyFK);
          nextChanges[localeFK] = change;

        }

      };

      return this._applyNextChanges(nextChanges);
    });
  }

}
