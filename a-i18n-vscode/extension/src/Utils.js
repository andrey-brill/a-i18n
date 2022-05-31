
import vscode from 'vscode';

import { endWithSlash } from './i18n/I18n.js';


export function toString$(uri) {

  if (uri) {

    if (uri.uri) { // workspace folder
      uri = uri.uri;
    }

    if (typeof uri !== 'string') {
      uri = uri.toString();
    }

    return uri;
  }

  throw new Error('Uri is null or undefined');
}

export function toPath$(uri) {
  return endWithSlash(toString$(uri));
}

export function toFileName$(uri) {
  return toString$(uri).split('/').pop();
}


export function errorHandler$(error) {
  console.error(error);
  console.log('error.json', JSON.stringify(error));
  vscode.window.showErrorMessage(error.message);
}


export function toUniqueShortPath$(paths = []) {

  if (paths.length === 0) {
    return {};
  }

  const all = new Set(paths);
  if (paths.length !== all.size) {
    throw new Error('Not unique paths');
  }

  const arrays = {};
  for (const path of paths) {

    const from = path.split('/');
    if (from[from.length - 1].trim() === '') {
      from.pop();
    }

    arrays[path] = {
      from,
      to: []
    }
  }

  const result = {};

  const arraysV = Object.values(arrays);

  let isUnique = false;
  while (!isUnique) {

    arraysV.forEach(a => {

      const v = a.from.pop();
      if (v && v != '') {
        a.to.unshift(v);
        a.path = a.to.join('/');
      };
    })

    const set = new Set(arraysV.map(a => a.path));
    isUnique = set.size === paths.length;
  }

  for (const path of paths) {
    result[path] = arrays[path].path;
  }

  return result;

}