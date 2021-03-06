
import { KeyValueSeparator } from './Constants.js';


export const ErrorCodes = {
  NotLoaded: 'NotLoaded',
  DuplicateKey: 'DuplicateKey',
  NotResolvedError: 'NotResolvedError',
  UnappliedChanges: 'UnappliedChanges',
  KeyNotExist: 'KeyNotExist',
  KeyExist: 'KeyExist',
  InvalidPath: 'InvalidPath',
  InvalidFormat: 'InvalidFormat',
  InvalidDirectory: 'InvalidDirectory',
  InvalidFile: 'InvalidFile',
  InvalidKey: 'InvalidKey',
  InvalidOptions: 'InvalidOptions',
  NotUniqueI18nFiles: 'NotUniqueI18nFiles',
  NoI18nJsFiles: 'NoI18nJsFiles',
  Export: 'Export'
};

export class I18nError extends Error {

  constructor(code, message) {
    super(message);
    this.code = code;
  }

  toString() {
    return 'I18N -> ' + super.toString();
  }
}

class StateError extends I18nError {
  constructor(code, message) {
    super(code, message);
    this.stateError = true;
  }
}


export class InvalidFormatError extends StateError {
  constructor(rest) {
    super(ErrorCodes.InvalidFormat, `Can't parse i18n content.\nInvalid content: ${rest}`);
  }
}
export class DuplicateKeyError extends StateError {
  constructor(key) {
    super(ErrorCodes.DuplicateKey, `All i18n-keys must be unique.\nFound duplicated key: ${key}`);
  }
}

export class NotUniqueI18nFilesError extends StateError {
  constructor(file1, file2) {
    super(ErrorCodes.NotUniqueI18nFiles, `All locales of i18n-files must be unique.\nFound duplicated locale: ${file1} & ${file2}`)
  }
}


export class NotResolvedError extends I18nError {
  constructor(error) {
    super(ErrorCodes.NotResolvedError, 'Before continue editing i18n, pleas fix state error: ' + error.message);
  }
}

export class NotLoadedError extends I18nError {
  constructor() {
    super(ErrorCodes.NotLoaded, 'Resources not loaded to make the action.');
  }
}

export class InvalidOptionsError extends I18nError {
  constructor() {
    super(ErrorCodes.InvalidOptions, `Options can't be a function.`);
  }
}

export class KeyNotExistError extends I18nError {
  constructor(key) {
    super(ErrorCodes.KeyNotExist, `Key "${key}" don't exist anymore.`);
  }
}

export class KeyExistError extends I18nError {
  constructor(key) {
    super(ErrorCodes.KeyExist, `Key "${key}" already exist.`);
  }
}


export class NoI18nJsFileError extends I18nError {
  constructor() {
    super(ErrorCodes.NoI18nJsFiles, `.i18n.js file not found to make new export.`)
  }
}


export class InvalidDirectoryError extends I18nError {
  constructor(directory) {
    super(ErrorCodes.InvalidDirectory, `I18n-directory doesn't exist: ${directory}. Please, check configuration.`);
  }
}

export class InvalidPathError extends I18nError {
  constructor(path) {
    super(ErrorCodes.InvalidPath, `Invalid path: ${path}`);
  }
}

export class InvalidKeyError extends I18nError {
  constructor(key) {
    super(ErrorCodes.InvalidKey, `Key is invalid "${key}" (empty or contains ${KeyValueSeparator}).`);
  }
}
