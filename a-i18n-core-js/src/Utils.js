
import { ApprovedLine, BacklogI18n, CommentLine, DeleteKeyLine, FileNameRegExp, FullKeySeparator, I18n, I18nJs, KeyValueSeparator, NewLineSymbol, NewLineSymbolRegEx, NotApprovedLine, RootDirectory } from './Constants.js';


export const debounceAction$ = (obj, callback, time) => {

  let waiting = false;

  return function (options) {

    if (waiting) {
      return;
    }

    waiting = true;
    setTimeout(function () {
      callback.apply(obj, options);
      waiting = false;
    }, time);

  };
};

export const getTime$ = () => new Date().getTime();

export const isI18nFile$ = (fileName) => FileNameRegExp.test(fileName);
export const isBacklogFile$ = (fileName) => fileName.endsWith(BacklogI18n);
export const isI18nJsFile$ = (fileName) => fileName === I18nJs;

export const toBacklog$ = (path) => path.substring(0, path.length - I18n.length) + BacklogI18n;


export const detectLocale$ = (fileName) => {
  const match = fileName.match(FileNameRegExp);
  return match ? match[2] + (match[3] || '') : undefined;
};

export const safeValue$ = (value = '') => value.trim().replace(/\n/g, NewLineSymbol);
export const unsafeValue$ = (value = '') => value.replace(NewLineSymbolRegEx, '\n');


export const commentLine$ = (key, comment) => CommentLine + key + KeyValueSeparator + safeValue$(comment);
export const valueLine$ = (approved, key, value) => (approved ? ApprovedLine : NotApprovedLine) + key + KeyValueSeparator + safeValue$(value);
export const deleteLine$ = (key) => DeleteKeyLine + key;


export const buildFK$ = (fileName, key) => fileName + FullKeySeparator + key;
export const splitFK$ = (fullKey) => fullKey.split(FullKeySeparator);


export const endWithSlash$ = (path = '') => {
  return path.endsWith('/') ? path : (path.endsWith('\\') ? path.substring(0, path.length - 1) + '/' : path + '/');
}

export const toPromise = (obj) => {

  if (obj && obj.then) return obj;

  if (obj && typeof obj === 'function') {
    return new Promise((resolve) => resolve(obj()));
  }

  return Promise.resolve(obj);
}

export const directoryFrom$ = (path) => {
  const parts = path.split('/');
  parts.pop();
  return endWithSlash$(parts.join('/'));
}