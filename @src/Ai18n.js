
import { ErrorCodes, InvalidLineError, NotLoadedError, I18nError, NotResolvedError, DuplicateKeyError, UnappliedChangesError, KeyExistError, KeyNotExistError, InvalidDirectoryError, NoI18nFilesError, InvalidKeyError, ExportError, NoI18nJsFileError } from './Errors.js';
import { debounceAction$, safeValue$, detectLocale$, isI18nFile$, isI18nJsFile$, getTime$, unsafeValue$, commentLine$, valueLine$, deleteLine$, splitFK$, buildFK$, endWithSlash$, toBacklog$ } from './Utils.js';
import { CommentLine, ApprovedLine, NotApprovedLine, DeleteKeyLine, KeyValueSeparator, AutoExport, ManualExport, TypeFile, I18n, BacklogI18n, DefaultI18n } from './Constants.js';

import { SortedArray } from './SortedArray.js';
import { ConfigDefaults } from './ConfigDefaults.js';


function parseLines$(content = '') {

  content = content.trim();
  if (content.length === 0) {
    return [];
  }

  const lines = [];

  let isKey = true;
  let startIndex = 0;
  let type = '';
  let key = '';

  for (let i = 0; i < content.length; i++) {

    let current = content[i];

    if (isKey) {
      if (startIndex === i) {
        if (current === '\n' || content[i] === '\r') { // ignore \n after \r and empty lines
          startIndex++;
        } else {
          type = current;
        }
      } else {
        if (current === '=') {
          key = content.substring(startIndex + 1, i);
          startIndex = i + 1;
          isKey = false;
        }
      }
    } else {
      if (content[i] === '\r' || content[i] === '\n' || (content.length - 1 === i)) {

        const value = content.substring(startIndex, i);

        if (type === CommentLine) {
          lines.push({
            type,
            key,
            comment: value
          });
        } else {
          lines.push({
            type,
            key,
            value,
            approved: type === ApprovedLine
          });
        }

        isKey = true;
        startIndex = i + 1;
      }

    }

  }

  return lines;
}

// function pareLine$(line) {

//   const lines = pareLines$(line);
//   if (lines.length !== 1) {
//     throw new InvalidLineError(line);
//   }

//   return lines[0];
// }


export class Ai18n {

  constructor(config = {}) {

    this._exportChangeIndex = 0;
    this._lastTimeUpdated = 0;

    this._config = Object.assign({}, ConfigDefaults, config);
    this._fs = new this._config.fs(this.__initializeFS$(), this._config.directory);

    this._resetState$();

    this._debounceChange = debounceAction$(this, this._debounceChange, 100, this._config.errorHandler);
    this._debounceExport = debounceAction$(this, this._debounceExport, 300, this._config.errorHandler);

    this.autoExport = this._config.autoExport;
  }

  _catchPromise(promise) {
    return promise.catch((e) => this._config.errorHandler(e));
  }

  __initializeFS$() {
    throw new Error('Not implemented');
  }

  _logExportInfo$(info, isError) {
    if (isError) {
      console.error(info);
    } else {
      console.log(info);
    }
  }

  _resetState$() {

    delete this.state;

    this.state = {
      keys: new SortedArray(),
      updates: undefined,
      original: undefined,
      files: [],
      updated: {},
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

    this.state.original = this.state.updated;
    this.state.updated = {};
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
    for (const parsedLine of lines) {

      const { keys, original, updates, updated } = this.state;

      const fullKey = buildFK$(fileName, parsedLine.key);

      updates.length++;
      updates.before[fullKey] = original[fullKey];

      if (parsedLine.type === DeleteKeyLine) {
        delete updates.after[fullKey];
        delete updated[fullKey];
        keys.remove(parsedLine.key);
      } else {
        const translation = Object.assign(updated[fullKey] || {}, parsedLine); // order important
        updated[fullKey] = translation;
        updates.after[fullKey] = translation;
      }
    }
  }

  _updateKeys$() {
    const updateKeys = new Set();
    Object.keys(this.state.updates.before).forEach(fullKey => updateKeys.add(fullKey));
    Object.keys(this.state.updates.after).forEach(fullKey => updateKeys.add(fullKey));
    return updateKeys;
  }

  // removing updates if they don't change the state
  _optimizeUpdates() {

    const updateKeys = this._updateKeys$();
    if (updateKeys.size === 0) {
      return Promise.resolve(true);
    }

    updateKeys.forEach((fullKey) => {

      const original = this.state.original[fullKey];
      const updated = this.state.updated[fullKey];

      if (original && updated &&
        safeValue$(original.comment) === safeValue$(updated.comment) &&
        safeValue$(original.value) === safeValue$(updated.value) &&
        (original.approved || false) === (updated.approved || false)) {
        delete this.state.updates.before[fullKey];
        delete this.state.updates.after[fullKey];
      }
    });

    const optimizedKeys = this._updateKeys$();
    this.state.updates.length = optimizedKeys.size;

    if (updateKeys.size > 0 && optimizedKeys.size === 0) {
      return this.save(); // making sure if all updates "reverted" to remove update-lines from files
    } else {
      return Promise.resolve(true);
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

  _findFiles(filter$, returnFirst = false) {
    return this._fs.existDirectory()
      .then(isExists => {

        if (!isExists) {
          throw new InvalidDirectoryError(this._config.directory);
        }

        return this._fs.readDirectory();
      })
      .then((content = [] ) => {

        const r = content
          .filter(info => info[1] === TypeFile && filter$(info[0]))
          .map(info => this._nameToFile$(info[0]));

        return returnFirst ? r[0] : r;
      });
  }

  _findI18nFiles() { return this._findFiles(isI18nFile$); };
  _findI18nJsFile() { return this._findFiles(isI18nJsFile$, true); };

  _appendUpdate(fileName, line) {

    this._lastTimeUpdated = getTime$();
    this._updateState$(fileName, line);

    return this._fs
      .appendFile(this._fs.pathTo$(fileName), line)
      .then(() => {
        this._lastTimeUpdated = getTime$();
      });
  }

  _debounceChange() {
    try {
      if (this._onChange) {
        this._onChange(this._cloneState$());
      }
    } finally {
      this.state.keys.updated = false;
    }
  }

  _validateKey$(key) {

    if (key && key.length > 0 && key.indexOf(KeyValueSeparator) === -1) {
      return;
    }

    throw new InvalidKeyError(key);
  }

  // TODO
  _debounceExport() {
    if (this.autoExport) {
      this.export({ type: AutoExport });
    }
  }

  // TODO
  _export(exportOptions, exporter) {

    try {
      const { validate = () => true, begin, write, done = () => true, save  } = exporter;

      if (!validate(exportOptions, this.state)) {
        return Promise.resolve();
      }

      for (const file of this.state.files) {

        const fileState = begin(exportOptions, file);
        for (const key of this.state.keys.array) {

          const t = this.state.original[buildFK$(file.name, key)];
          if (t) {

            const unsafeT = Object.assign({}, t, {
              value: unsafeValue$(t.value),
              comment: unsafeValue$(t.comment)
            })

            write(fileState, unsafeT);
          }
        }

        done(fileState, file);
      }

      return save()
        .then(exportInfo => this._logExportInfo$(exportInfo))
        .catch(e => this._logExportInfo$(new ExportError(e), true))

    } catch (e) {
      this._logExportInfo$(new ExportError(e), true)
    }
  }

  // TODO
  connect({ onChange }) {

    if (!fs.existsSync(this._config.directory)) {
      throw new InvalidDirectoryError(this._config.directory);
    }

    if (!this.state.loaded) {
      this.load();
    }

    this._onChange = onChange;

    const ignoreChangesTimeoutMs = 1000;
    const debounceLoad = debounceAction$(this, this.load, 300, this._config.errorHandler); // if several updates applied at the same time

    const watcher = fs.watch(this._config.directory, undefined, (eventType, fileName) => {

      if (isI18nJsFile$(fileName)) {
        this._exportChangeIndex++;
        return this._debounceExport();
      }

      if (isI18nFile$(fileName)) {
        if (this._lastTimeUpdated + ignoreChangesTimeoutMs < getTime$()) {
          debounceLoad();
        }
      }
    });

    return () => {
      delete this._onChange;
      watcher.close();
    };
  }

  load() {

    this._resetState$();

    return this._catchPromise(
      this._findI18nFiles()
        .then(files => {

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
                this.state.original[fullKey] = Object.assign(this.state.original[fullKey] || {}, parsedLine); // important
                const targetSet = parsedLine.type === CommentLine ? commentKeys : valueKeys;

                if (targetSet.has(parsedLine.key)) {
                  throw new DuplicateKeyError(parsedLine.key + ` [${file.name}:${lineNumber}]`);
                } else {
                  keys.add(parsedLine.key);
                  targetSet.add(parsedLine.key);
                }
              }

            }

            // updates must be applied
            const backlogOffset = this.state.files.length;
            for (let fi = 0; fi < this.state.files.length; fi++) {
              const file = this.state.files[fi];
              const backlog = contents[backlogOffset + fi];
              this._updateState$(file.name, backlog);
            }

            this.state.keys.array = Array.from(keys.values());


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

          return this._optimizeUpdates().then(() => {
            this._debounceChange();
            this._debounceExport();
          });
        })
    );
  }

  // important to make updates to local files under development
  // save state to fs (current state - with updates)
  save() {

    this._lastTimeUpdated = getTime$();

    const files = this.state.files.map(file => ({
      name: file.name,
      path: file.path,
      backlog: toBacklog$(file.path),
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

    return this._catchPromise(
      Promise.all(files.map(file => {

        return this._fs.writeFile(file.path, file.lines.join('\n'))
          .then(() => {
            this._lastTimeUpdated = getTime$();
            return this._fs.delete(file.backlog)
          });

      }))
        .then(() => {
          this._lastTimeUpdated = getTime$();
          return this.load();
        })
    );
  }

  export(options = {}) {

    this._validateAction$(options);

    const exportFile = this._findI18nJsFile();
    if (!exportFile && !this._config.exporter) {
      return;
    }

    const exportOptions = Object.assign({ type: ManualExport, config: this._config }, options);

    if (this.state.error) {
      throw new NotResolvedError(this.state.error);
    }

    if (this._config.exporter) {
      this._export(exportOptions, this._config.exporter);
      return;
    }

    // TODO
    // const absolutePath = resolve(exportFile.path);
    // if (!fs.existsSync(absolutePath)) {

    //   if (exportOptions.type === AutoExport) {
    //     return;
    //   }

    //   throw new NoI18nJsFileError();
    // }

    // const modulePath = 'file://' + absolutePath.replace(/\\/g, '/') + '?v=' + this._exportChangeIndex;
    // import(modulePath).then(module => this._export(exportOptions, module.default));
  }

  addFile(options = {}) {

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

    try {
      this._config.createFile(this._fs.pathTo$(fileName));
    } catch (e) {
      throw new I18nError(ErrorCodes.InvalidFile, e.message);
    }

    this.save();
  }

  deleteFile(options = {}) {

    this._validateAction$(options);

    const { fileName = '' } = options;

    if (this.state.updates.length) {
      throw new UnappliedChangesError();
    }

    if (!this._findI18nFiles().some(file => file.name === fileName)) {
      return;
    }

    try {
      this._config.deleteFile(this._fs.pathTo$(fileName));
    } catch (e) {
      throw new I18nError(ErrorCodes.InvalidFile, e.message);
    }

    this.save();
  }

  addKey(options = {}) {

    this._validateAction$(options);

    const { key } = options;
    this._validateKey$(key);

    const sortedIndex = this.state.keys.sortedIndexOf(key);
    if (sortedIndex === -1) {
      throw new KeyExistError(key);
    }

    const files = this._findI18nFiles();
    if (files.length == 0) {
      throw new NoI18nFilesError();
    }

    this.state.keys.insert(sortedIndex, key);

    for (const file of files) {
      this.updateValue(file.name, key);
    }
  }

  copyKey(options = {}) {

    this._validateAction$(options);

    const { fromKey, toKey } = options;
    if (fromKey === toKey) {
      return;
    }

    this._validateKey$(fromKey);
    this._validateKey$(toKey);

    const files = this._findI18nFiles();
    if (files.length == 0) {
      throw new NoI18nFilesError();
    }

    if (this.state.keys.indexOf(fromKey) === -1) {
      throw new KeyNotExistError(fromKey);
    }

    const sortedIndex = this.state.keys.sortedIndexOf(toKey);
    if (sortedIndex === -1) {
      throw new KeyExistError(toKey);
    }

    this.state.keys.insert(sortedIndex, toKey);

    for (const file of files) {
      const fullKey = buildFK$(file.name, fromKey);
      this.updateTranslation(Object.assign({ fileName: file.name, key: toKey }, this.state.updated[fullKey]));
    }

  }

  renameKey(options = {}) {

    this._validateAction$(options);

    const { fromKey, toKey } = options;
    if (fromKey === toKey) {
      return;
    }

    this._validateKey$(fromKey);
    this._validateKey$(toKey);

    this.copyKey({ fromKey, toKey });
    this.deleteKey({ fromKey });
  }

  deleteKey(options = {}) {

    this._validateAction$(options);

    const { key } = options;
    this._validateKey$(key);

    if (this.state.keys.remove(key)) {

      for (const file of this._findI18nFiles()) {
        this._appendUpdate(file.name, deleteLine$(key));
      }

      this._optimizeUpdates();
      this._debounceChange();
    }
  }

  updateValue(options = {}) {

    this._validateAction$(options);

    const { fileName, key, value } = options;
    this._validateKey$(key);

    this._appendUpdate(fileName, valueLine$(false, key, value));
    this._optimizeUpdates();
    this._debounceChange();
  }

  updateApproved(options = {}) {

    this._validateAction$(options);

    const { fileName, key, approved = false } = options;
    this._validateKey$(key);

    const fileNames = [];
    if (fileName) {
      fileNames.push(fileName);
    } else {
      fileNames = this._findI18nFiles().map(f => f.name);
    }

    for (const fName of fileNames) {
      const value = this.state.updated[buildFK$(fName, key)]?.value;
      this._appendUpdate(fName, valueLine$(approved, key, value));
    }

    this._optimizeUpdates();
    this._debounceChange();
  }

  updateComment(options = {}) {

    this._validateAction$(options);

    const { fileName, key, comment } = options;
    this._validateKey$(key);

    this._appendUpdate(fileName, commentLine$(key, comment));
    this._optimizeUpdates();
    this._debounceChange();
  }

  updateTranslation(options = {}) {

    this._validateAction$(options);

    const { fileName, key, value, comment, approved = false } = options;
    this._validateKey$(key);

    this._appendUpdate(fileName, commentLine$(key, comment));
    this._appendUpdate(fileName, valueLine$(approved, key, value));
    this._optimizeUpdates();
    this._debounceChange();
  }

  revertUpdates(options = {}) {

    this._validateAction$(options);

    const { fileName, key } = options;
    const updateKeys = this._updateKeys$();
    if (updateKeys.size === 0) {
      return;
    }

    const files =  this._findI18nFiles();

    for (const fullKey of updateKeys) {

      const [ fileNameFK, keyFK ] = splitFK$(fullKey);

      const sameFileName = fileName === fileNameFK;
      const sameKey = key === keyFK;

      if (
        (fileName && key && (!sameFileName || !sameKey)) ||
        (fileName && !key && !sameFileName) ||
        (!fileName && key && !sameKey)
        ) {
        return;
      }

      const original = this.state.original[fullKey];
      if (original) {
        this._appendUpdate(fileNameFK, commentLine$(keyFK, original.comment));
        this._appendUpdate(fileNameFK, valueLine$(original.approved, keyFK, original.comment));
      } else {
        for (const file of files) {
          this._appendUpdate(file.name, deleteLine$(keyFK));
        }
      }

    };

    this._optimizeUpdates();
  }
}
