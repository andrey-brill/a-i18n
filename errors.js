
export const ErrorCodes = {
	Wtf: 'Wtf',
	I18nError: 'I18nError', //
	InvalidLine: 'InvalidLine',
	DuplicateKey: 'DuplicateKey',
	NotResolvedError: 'NotResolvedError',
	UnappliedChanges: 'UnappliedChanges',
	KeyNotExist: 'KeyNotExist',
	KeyExist: 'KeyExist',
	InvalidDirectory: 'InvalidDirectory',
	InvalidFile: 'InvalidFile',
	NoI18nFiles: 'NoI18nFiles'
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

export class InvalidLineError extends StateError {
	constructor(line) {
		super(ErrorCodes.InvalidLine, `Can't parse line (invalid format): ${line}`);
	}
}

export class DuplicateKeyError extends StateError {
	constructor(key) {
		super(ErrorCodes.DuplicateKey, `Can't parse line (duplicate key): ${key}`);
	}
}

export class NotResolvedError extends I18nError {
	constructor(error) {
		super(ErrorCodes.NotResolvedError, 'Before continue editing i18n, pleas fix state error: ' + error.message);
	}
}

export class WtfError extends I18nError {
	constructor() {
		super(ErrorCodes.Wtf, 'This should never happen!');
	}
}

export class UnappliedChangesError extends I18nError {
	constructor() {
		super(ErrorCodes.UnappliedChanges, 'You need to apply changes first.');
	}
}

export class KeyNotExistError extends I18nError {
	constructor(key) {
		super(ErrorCodes.KeyNotExist, `Key "${key}" don't exist anymore`);
	}
}

export class KeyExistError extends I18nError {
	constructor(key) {
		super(ErrorCodes.KeyExist, `Key "${key}" already exist`);
	}
}

export class NoI18nFilesError extends I18nError {
	constructor() {
		super(ErrorCodes.NoI18nFiles, `I18n files not found to process current action.`)
	}
}