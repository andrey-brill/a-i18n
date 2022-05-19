
import { RootDirectory } from './Constants.js';
import { FileSystem } from './FileSystem.js';


export const ConfigDefaults = {

  directory: RootDirectory, // relative path
  rootPath: null, // absolute path to root directory (with .i18n.json config file)

  autoExport: false, // needed to improve cli.js default behavior

  errorHandler: (error) => { throw error; },
  exportHandler: (result, isError) => { if (isError) throw result; },

  fs: FileSystem,
  exporter: undefined /* {
    validate?(state) - throw error if invalid
    begin(file) -> fileData
    insert(fileData, translation)
    end?(file)
    save() - must return Promise
  } */

};


