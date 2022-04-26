
import { ApprovedLine, CommentLine, DeleteKeyLine, KeyValueSeparator, NewLineSymbol, NewLineSymbolRegEx, NotApprovedLine } from './Constants.js';


export const getPublicFunctions = (obj) => Object
  .getOwnPropertyNames(obj.__proto__)
  .filter(prop => prop !== 'constructor' && prop !== 'initialize' && prop[0] !== '_' && typeof obj[prop] === 'function')
  .map(fnName => [obj[fnName], fnName]);

const stringify = (options) => {

  const keys = Object.keys(options);
  if (keys.length <= 0)
    return '{}';

  const result = {};
  for (const key of keys) {
    const v = options[key];
    result[key] = v && typeof v === 'function' ? key + '()' : v;
  }

  return JSON.stringify(result);
};

export const debug = (obj) => getPublicFunctions(obj)
  .forEach(([fn, fnName]) => {
    obj[fnName] = (options = {}) => {
      console.time(fnName);
      console.log(fnName + ' ' + stringify(options));
      fn.call(obj, options);
      console.timeEnd(fnName);
    };
  });

export const debounceAction = (obj, callback, time, errorHandler) => {

  let waiting = false;

  return function (options) {

    if (waiting) {
      return;
    }

    waiting = true;
    setTimeout(function () {
      try {
        callback.apply(obj, options);
      } catch (error) {
        errorHandler(error);
      }
      waiting = false;
    }, time);

  };
};

export const getTime = () => new Date().getTime();

export const isI18nFile = (fileName) => fileName.endsWith('.i18n');
export const isI18nJsFile = (fileName) => fileName === '.i18n.js';

export const detectLocale = (files) => {

  files.forEach(f => {
    const match = f.name.match(/^(.*[^a-zA-Z])?([a-z][a-z])(-[A-Z][A-Z])?\.i18n$/);
    f.locale = match ? match[2] + (match[3] || '') : undefined;
  });

  return files;
};

export const safeValue = (value = '') => value.trim().replace(/\n/g, NewLineSymbol);
export const unsafeValue = (value = '') => value.replace(NewLineSymbolRegEx, '\n');


export const commentLine = (key, comment) => CommentLine + key + KeyValueSeparator + safeValue(comment);
export const valueLine = (approved, key, value) => (approved ? ApprovedLine : NotApprovedLine) + key + KeyValueSeparator + safeValue(value);
export const deleteLine = (key) => DeleteKeyLine + key;