
// FS wrapper to support node.fs and vscode.workspace.fs packages

import { Encoding, RootDirectory } from './Constants.js';
import { InvalidDirectoryError, InvalidPathError } from './Errors.js';
import { directoryFrom, endWithoutSlash, endWithSlash, toPromise } from './Utils.js';


function validateRelativePath(path) {

  if (!path || typeof path !== 'string' || !path.startsWith(RootDirectory)) {
    throw new InvalidPathError(path);
  }

  return path; // important
}

export class FileSystem {

  constructor (fs, config) {

    // file system provider
    this._fs = fs;

    // directory with .i18n files
    this._directory = endWithSlash(validateRelativePath(config.directory));

    // path to directory with .i18n.json config file
    this._rootPath = endWithSlash(this._fs.rootPath(config.rootPath));
  }

  _resolveFilePath (path) {
    validateRelativePath(path);
    return endWithoutSlash(this._rootPath + path.substring(RootDirectory.length));
  }

  _resolveDirPath (path) {
    validateRelativePath(path);
    return endWithSlash(this._rootPath + path.substring(RootDirectory.length));
  }

  validateDirectory (path = this._directory) {
    return this.existDirectory(path)
      .then(isExists => {

        if (!isExists) {
          throw new InvalidDirectoryError(path);
        }

        return isExists;
      });
  }

  createPath (path) {
    return toPromise(() => {

      validateRelativePath(path);

      const directory = directoryFrom(path);
      if (directory === this._directory || directory === RootDirectory) {
        return toPromise(true);
      } else {

        const parts = directory.split('/');
        const prefix = parts.shift();

        if (parts[parts.length - 1].trim() === '') parts.pop();

        const toCreate = [];
        for (const part of parts) {
          toCreate.push((toCreate[toCreate.length - 1] || prefix) + '/' + part);
        }

        const that = this;

        function createPromise() {

          const dir = toCreate.shift();
          if (!dir) return true;

          return that.existDirectory(dir)
            .then(isExists => isExists ? true : that._fs.createDirectory(dir))
            .then(() => createPromise());
        }

        return createPromise();
      }
    });
  }

  pathTo (fileName) { return this._directory + fileName; }

  deleteFile (path) {
    const rPath = this._resolveFilePath(path);
    return this._fs.existFile(rPath)
      .then(isExists => isExists ? this._fs.delete(rPath) : true);
  }

  deleteDirectory (path) {
    const rPath = this._resolveDirPath(path);
    return this._fs.existDirectory(rPath)
      .then(isExists => isExists ? this._fs.delete(rPath) : true);
  }

  readFile (path, options = { encoding : Encoding }) {
    return this.existFile(path).then(isExists => {
      if (isExists) return this._fs.readFile(this._resolveFilePath(path), options);
      return '';
    });
  }

  writeFile (path, data = '', options = { encoding : Encoding }) { return this._fs.writeFile(this._resolveFilePath(path), data, options); }

  appendContent (path, content, options = { encoding : Encoding }) {
    return this.readFile(path, options)
      .then(contentNow => {
        const prefix = (contentNow.length === 0 || contentNow[contentNow.length - 1] === '\n') ? '' : '\n';
        const suffix = content[content.length - 1] === '\n' ? '' : '\n';
        return this.writeFile(path, contentNow + prefix + content + suffix, options);
      });
  }

  readDirectory (path = this._directory) { return this._fs.readDirectory(this._resolveDirPath(path)); }

  existDirectory (path = this._directory) { return this._fs.existDirectory(this._resolveDirPath(path)); }
  existFile (path) { return this._fs.existFile(this._resolveFilePath(path)); }

  watch (listener, path = this._directory) { return this._fs.watch(this._resolveDirPath(path), listener); }

}