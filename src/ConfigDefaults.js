
import fs from 'fs';
import os from 'os';

import LineReader from './LineReader.js';
import LineWriter from './LineWriter.js';


export const ConfigDefaults = {

  directory: './',
  debug: false,
  autoExport: true,

  // next functions added to make possible mocking
  lineReader: (path) => new LineReader(path),
  lineWriter: (path) => new LineWriter(path),
  appendLine: (path, line) => fs.appendFileSync(path, line + os.EOL),
  filesIn: (directory) => fs.readdirSync(directory),
  createFile: (path) => fs.closeSync(fs.openSync(path, 'w')),
  deleteFile: (path) => fs.unlinkSync(path),
  exporter: undefined // () => export module { validate(), open(), write(), close() }
};
