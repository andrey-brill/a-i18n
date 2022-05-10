
// FS wrapper to support node.fs and vscode.workspace.fs packages

import { Encoding, RootDirectory } from './Constants.js';
import { InvalidPathError } from './Errors.js';
import { endWithSlash$ } from './Utils.js';


export class FileSystem {

  constructor (fs, directory = RootDirectory) {
    this._fs = fs;
    this.directory = endWithSlash$(directory);
  }

  _rootPath$ () { return endWithSlash$(this._fs.rootPath$()); }

  _resolvePath$ (path) {

    if (!path || typeof path !== 'string' || !path.startsWith(RootDirectory)) {
      throw new InvalidPathError(path);
    }

    return endWithSlash$(this._rootPath$() + path.substring(RootDirectory.length));
  }

  pathTo$ (fileName) { return this.directory + fileName; }

  delete (path) { return this._fs.delete(this._resolvePath$(path)) }

  readFile (path, options = { encoding : Encoding }) {
    return this.existFile(path).then(isExist => {
      if (isExist) return this._fs.readFile(this._resolvePath$(path), options);
      return '';
    });
  }
  writeFile (path, data, options = { encoding : Encoding }) { return this._fs.writeFile(this._resolvePath$(path), data, options); }

  appendFile (path, data, options = { encoding : Encoding }) {
    return this.readFile(path, options)
      .then(content => this.writeFile(path, content + data, options));
  }

  readDirectory (path = this.directory) { return this._fs.readDirectory(this._resolvePath$(path)); }

  existDirectory (path = this.directory) { return this._fs.existDirectory(this._resolvePath$(path)); }
  existFile (path) { return this._fs.existFile(this._resolvePath$(path)); }

}