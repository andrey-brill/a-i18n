
import { RootDirectory } from './Constants.js';
import { FileSystem } from './FileSystem.js';


export const ConfigDefaults = {

  directory: RootDirectory,
  autoExport: false, // needed to improve cli.js default behavior

  // Mocking params:
  fs: FileSystem,
  errorHandler: (error) => { throw error; },
  exporter: undefined // { validate(), open(), write(), close() }

};


