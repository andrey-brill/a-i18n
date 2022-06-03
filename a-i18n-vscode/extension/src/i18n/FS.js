import vscode, { Uri } from 'vscode';

import { TypeDirectory, TypeFile } from '../../../../a-i18n-core-js/index.js';
import { toFileName } from '../Utils.js';


const fs = vscode.workspace.fs;


const exists = (path, fileType) => new Promise((resolve, reject) => {
  fs.stat(Uri.parse(path))
    .then(info => resolve(info.type === fileType))
    .catch(e => {
      if (e.code === 'ENOENT' || e.code === 'FileNotFound' || (e.message && e.message.indexOf('ENOENT') >= 0)) {
        resolve(false)
      } else {
        reject(e);
      }
    })
});

const encoder = new TextEncoder();
const decoder = new TextDecoder();


export const FS = {

  rootPath: (rootPath) => rootPath,
  delete: (path) => fs.delete(Uri.parse(path), { recursive: true }),

  readFile: (path) => fs.readFile(Uri.parse(path)).then(buffer => decoder.decode(buffer)),
  writeFile: (path, data) => fs.writeFile(Uri.parse(path), encoder.encode(data)),

  createDirectory: (path) => fs.createDirectory(Uri.parse(path)),
  readDirectory: (path) => fs.readDirectory(Uri.parse(path)),

  existDirectory: (path) => exists(path, TypeDirectory),
  existFile: (path) => exists(path, TypeFile),

  watch: (path, listener) => {

    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(Uri.parse(path), '*')
    );

    watcher.onDidChange(uri => listener(toFileName(uri)));
    watcher.onDidCreate(uri => listener(toFileName(uri)));
    watcher.onDidDelete(uri => listener(toFileName(uri)));

    return () => {
      watcher.dispose();
    };
  }
};
