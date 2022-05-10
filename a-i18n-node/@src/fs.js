
import fs from 'fs/promises';
import { resolve } from 'path';

import { TypeFile, TypeDirectory, RootDirectory } from '../../index.js';


const exists = (path, fileType) => new Promise((resolve, reject) => {
  fs.stat(path)
    .then(info => resolve((info.isFile() && fileType === TypeFile) || (info.isDirectory() && fileType === TypeDirectory)))
    .catch(e => {
      if (e.code === 'ENOENT') {
        resolve(false)
      } else {
        reject(e);
      }
    })
});


export const FS = {

  rootPath$: () => resolve(RootDirectory),
  delete: (path) => fs.rm(path, { recursive: true, force: true }), // ignore not existing error

  readFile: (path, options) => fs.readFile(path, options).then(buffer => buffer.toString(options.encoding)),
  writeFile: (path, data, options) => fs.writeFile(path, data, options),

  readDirectory: (path) => new Promise((resolve, reject) => {
    fs.readdir(path, { withFileTypes: true })
      .then(content => resolve(content.map(file => [file.name, file.isFile() ? TypeFile : TypeDirectory])))
      .catch(reject)
  }),

  existDirectory: (path) => exists(path, TypeDirectory),
  existFile: (path) => exists(path, TypeFile)
};
