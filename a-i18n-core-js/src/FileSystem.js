
// FS wrapper to support node.fs and vscode.workspace.fs packages

import { Encoding, RootDirectory } from './Constants.js';
import { InvalidDirectoryError, InvalidPathError } from './Errors.js';
import { directoryFrom$, endWithSlash$, toPromise } from './Utils.js';


function validateRelativePath$(path) {
  if (!path || typeof path !== 'string' || !path.startsWith(RootDirectory)) {
    throw new InvalidPathError(path);
  }
}

export class FileSystem {

  constructor (fs, config) {

    // file system provider
    this._fs = fs;

    // directory with .i18n files
    this._directory = endWithSlash$(validateRelativePath$(config.directory));

    // path to directory with .i18n.json config file
    this._rootPath = endWithSlash$(this._fs.rootPath$(config.rootPath));
  }

  _resolvePath$ (path) {
    validateRelativePath$(path);
    return endWithSlash$(this._rootPath + path.substring(RootDirectory.length));
  }

  validateDirectory (path = this._directory) {
    return this._fs.existDirectory(path)
      .then(isExists => {

        if (!isExists) {
          throw new InvalidDirectoryError(path);
        }

        return isExists;
      });
  }

  createPath (path) {
    return toPromise(() => {

      validateRelativePath$(path);

      const directory = directoryFrom$(path);
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

  pathTo$ (fileName) { return this._directory + fileName; }

  delete (path) { return this._fs.delete(this._resolvePath$(path)) }

  readFile (path, options = { encoding : Encoding }) {
    return this.existFile(path).then(isExists => {
      if (isExists) return this._fs.readFile(this._resolvePath$(path), options);
      return '';
    });
  }

  writeFile (path, data = '', options = { encoding : Encoding }) { return this._fs.writeFile(this._resolvePath$(path), data, options); }

  appendLine (path, line, options = { encoding : Encoding }) {
    return this.readFile(path, options)
      .then(content => {
        const prefix = (content.length === 0 || content[content.length - 1] === '\n') ? '' : '\n';
        const suffix = line[line.length - 1] === '\n' ? '' : '\n';
        this.writeFile(path, content + prefix + line + suffix, options);
      });
  }

  readDirectory (path = this._directory) { return this._fs.readDirectory(this._resolvePath$(path)); }

  existDirectory (path = this._directory) { return this._fs.existDirectory(this._resolvePath$(path)); }
  existFile (path) { return this._fs.existFile(this._resolvePath$(path)); }

  watch$ (listener, path = this._directory) { return this._fs.watch$(this._resolvePath$(path), listener); }

}