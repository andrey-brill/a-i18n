import fs from 'fs';
import path from 'path';
import LineByLine from 'n-readlines';
import SortedSet from 'collections/sorted-set.js';

/*
a-i18n

put empty keys into other .i18n

^.*([a-z][a-z])(-[A-Z][A-Z])?.i18n $

line-format: ^[*!]?[+-/>=<#]key=.*$
key-format: [^='"`]+

\newline - should be in the end of a file!!!

* || !: incoming changes

# - deleted key (only in new lines)
+ - approved line
- - not approved line
/ - comment line to key

*[line] - incoming changes
![line] - manual approved changes merge (required before apply if conflicts is not auto resolved)

TODO edited deleted lines?
> - conflict in git
...
lines in current version
...
= // separator
...
lines in remote version
...
< // end of conflict


.i18n.js
INT = (() =>

const fs = require('fs');

const INT = {
  data: {},
  prepare: (int, locale) => {},
  map: (int, line) => {},
  save: (int, locale) => {}
};

return INT;)();

- shortcut key + command for add+edit(delete?) key
- shortcut key + command for apply changes
*/


class I18nError extends Error {
	constructor (code, message) {
		super(message);
		this.code = code;
	}
}

class StateError extends I18nError {
	constructor (code, message) {
		super(code, message);
		this.stateError = true;
	}
}

class InvalidLineError extends StateError {
	constructor(line) {
		super('InvalidLine', `Can't parse line (invalid format): ${line}`);
	}
}

class DuplicateKeyError extends StateError {
	constructor(key) {
		super('DuplicateKey', `Can't parse line (duplicate key): ${key}`);
	}
}

class NotResolvedError extends I18nError {
	constructor(error) {
		super('NotResolvedError', 'Before continue editing i18n, pleas fix occurred error: ' + error.message);
	}
}


class WtfError extends I18nError {
	constructor() {
		super('Wtf', 'This should never happen!');
	}
}

class ApplyChangesError extends I18nError {
	constructor() {
		super('ApplyChanges', 'You need to apply changes first.')
	}
}

class KeyNotExistError extends I18nError {
	constructor(key) {
		super('KeyNotExist', `Key "${key}" don't exist anymore`);
	}
}

class KeyExistError extends I18nError {
	constructor(key) {
		super('KeyExist', `Key "${key}" already exist`);
	}
}

const UpdateLine = '*';
const CommentLine = '/';
const ApprovedLine = '+';
const NotApprovedLine = '-';
const DeleteKeyLine = '#';

const FullKeySeparator = '|';
const KeyValueSeparator = '=';


const toFullKey = (fileName, key) => fileName + FullKeySeparator + key;
const isUpdateLine = (line) => line[0] === UpdateLine; // TODO || line[0] === '!'; - resolving conflicts from git

const parseLine = (line, typeIndex) => {

	const type = line[typeIndex];

	if (type !== CommentLine && type !== ApprovedLine && type !== NotApprovedLine && type !== DeleteKeyLine) {
		throw new InvalidLineError(line);
	}

	const parts = line.split(KeyValueSeparator);
	if (parts.length <= 1) {
		throw new InvalidLineError(line);
	}

	const key = parts.shift().substr(typeIndex + 1);
	if (!key || key.length <= 0) {
		throw new InvalidLineError(line);
	}

	return {
		type: type,
		key,
		value: parts.join(KeyValueSeparator)
	}
}



class State {

	constructor () {
		this.reset();
	}

	reset () {

		this.error = null;

		this.fileNames = []; // fileNames

		this.updates = {
			length: 0,
			before: {},
			after: {}
		};

		this.originalTranslations = {};

		this.keys = new SortedSet(); // needed to make search by key, and checking exists or not
		this.updatedTranslations = {};

		this.loaded = false;
	}

	setFileNames (fileNames = []) {
		this.fileNames = fileNames.filter(file => file.endsWith('.i18n'));
	}

	setError (error) {

		if (!error.stateError) {
			throw new WtfError();
		}

		this.error = error;
	}

	resolveTranslation (fullKey, parsedLine, targetObject) {

		let translation = targetObject[fullKey];
		if (!translation) {
			translation = targetObject[fullKey] = { key: parsedLine.key };
		}

		if (parsedLine.type === CommentLine) {
			translation.comment = parsedLine.value;
		} else {
			translation.value = parsedLine.value;
			translation.approved = parsedLine.type === ApprovedLine;
		}

		this.updatedTranslations[fullKey] = translation; // always updating

		return translation;
	}

	parse (fileName, line, keysInFile) {

		if (this.loaded) {
			throw new WtfError();
		}

		if (isUpdateLine(line)) {
			return line; // update-lines should be handled in the end
		}

		const parsedLine = parseLine(line, 0);
		const fullKey = toFullKey(fileName, parsedLine.key);

		const translation = this.resolveTranslation(fullKey, parsedLine, this.originalTranslations);

		if (this.updates.before[fullKey]) {
			this.updates.before[fullKey] = translation;
		}

		if (keysInFile.has(parsedLine.key)) {
			throw new DuplicateKeyError(parsedLine.key);
		}

		if (parsedLine.type !== CommentLine) {
			keysInFile.add(parsedLine.key);
		}

		this.keys.add(parsedLine.key);
	}

	update (fileName, line, silent) {

		if (!isUpdateLine(line)) {
			throw new WtfError();
		}

		const parsedLine = parseLine(line, 1);
		const fullKey = toFullKey(fileName, parsedLine.key);

		this.updates.length++;
		this.updates.before[fullKey] = this.originalTranslations[fullKey];

		if (parsedLine.type === DeleteKeyLine) {
			delete this.updates.after[fullKey];
			delete this.updatedTranslations[fullKey];
			this.keys.remove(parsedLine.key);
		} else {
			this.resolveTranslation(fullKey, parsedLine, this.updates.after);
		}

		if (!silent) {
			// write line to file
		}
	}

	hasUpdates () {
		return this.updates.length > 0;
	}
}

/* TODO ExtensionDefaults
  filesOrder: [
		/.*en\.i18n$/gi,
		/.*en[-_].{1,4}\.i18n$/gi
	]
*/

const ConfigDefaults = {

};

class I18n {

	constructor (config) {
		this.state = new State();
		this.configure(config);
	}

	configure (config) {
		this.config = Object.assign({}, ConfigDefaults, config);

	}

	add (fileName) {

		if (this.state.hasUpdates()) {
			throw new ApplyChangesError();
		}

		// add file to files
		// call apply
		// call load
	}

	delete (fileName) {

		if (this.state.hasUpdates()) {
			throw new ApplyChangesError();
		}

		// delete file from files
		// delete from disc
		// call load
	}

	addKey (key) {
		// check is key not exists
		// call update with empty lines
	}

	copyKey (fromKey, toKey) {
		// check is fromKey exists
		// check is toKey not exists
		// call update for each file
	}

	renameKey (fromKey, toKey) {
		this.copyKey(fromKey, toKey);
		this.deleteKey(fromKey);
	}

	deleteKey (key) {
		// add delete line
	}

	update (fileName, key, value, approved, comment) {

	}

	apply () {

	}

	load () {

		console.time("load");

		this.state.reset();
		this.state.setFileNames(fs.readdirSync(this.config.folder));

		try {

			const silentUpdate = true;

			for (const fileName of this.state.fileNames) {

				const liner = new LineByLine(path.join(this.config.folder, fileName))

				// making sure that file don't have applied duplicated keys
				const keysInFile = new Set();

				let lineNumber = 0;
				let lineB;
				const updates = [];

				while (lineB = liner.next()) {

					lineNumber++;

					const line = lineB.toString('utf-8');
					if (line.length > 0) {

						try {
							const update = this.state.parse(fileName, line, keysInFile);
							if (update) updates.push(update);
						} catch (e) {

							// adding more info
							if (e.stateError) {
								e.message = `[${fileName}:${lineNumber}] ` + e.message;
							}

							throw e;
						}
					}

				}

				keysInFile.clear();

				for (const line of updates) {
					// applying existing updates
					this.state.update(fileName, line, silentUpdate);
				}
			}

		} catch (e) {
			if (e.stateError) {
				this.state.setError(e);
			} else {
				throw e;
			}
		}
		finally {
			this.state.loaded = true;
		}

		console.timeEnd("load");
	}

	run (onChange) {

		this.load();

		return () => {
			// stop listeners;
		}
 	}

	build () {
		this.load();
	}

}

// const unicornFun = (input, {postfix = 'rainbows'} = {}) => {
// 	if (typeof input !== 'string') {
// 		throw new TypeError(`Expected a string, got ${typeof input}`);
// 	}

// 	return `${input} & ${postfix}`;
// };

// const i18n = new I18n({ folder: './tests/15k' });
// i18n.load();

// console.log('Keys:' + i18n.state.keys.length);
// console.log(i18n.state.fileNames);

// if (i18n.state.error) {
// 	console.error(i18n.state.error);
// }

export default I18n;
