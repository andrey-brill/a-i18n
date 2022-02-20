

import fs from 'fs';
import os from 'os';
import { join } from 'path';
import LineByLine from 'n-readlines';
import { ErrorCodes, InvalidLineError, WtfError, I18nError, NotResolvedError, DuplicateKeyError, UnappliedChangesError, KeyExistError, KeyNotExistError } from './errors.js';


const UpdateLine = '*';
const CommentLine = '/';
const ApprovedLine = '+';
const NotApprovedLine = '-';
const DeleteKeyLine = '#';

const KeyValueSeparator = '=';
const FullKeySeparator = KeyValueSeparator; // As key don't contains =, we can use '=' to split fullKey.


const FullKey = (fileName, key) => fileName + FullKeySeparator + key;

FullKey.fileName = (fullKey) => fullKey.substring(0, fullKey.lastIndexOf(FullKeySeparator));


class LineReader {

	constructor (path) {
		this.line = new LineByLine(path);
	}

	next () {
		const lineB = this.line.next();
		return lineB ?
			lineB.toString('utf-8').trim() : // .trim() important to trim \r on windows
			undefined;
	}

	close () {
		// TODO this.line.close(); (not working)
	}

}

class LineWriter {

	constructor (path) {
		this.fd = fs.openSync(path, 'w');
	}

	next (line) {
		fs.writeSync(this.fd, line + os.EOL);
	}

	close () {
		fs.closeSync(this.fd);
	}
}


const ConfigDefaults = {

	directory: './', // directory with .i18n files
	debug: true, // TODO false

	// next functions added to make possible mocking
	lineReader: (path) => new LineReader(path), // next(), close()
	lineWriter: (path) => new LineWriter(path), // next(), close()
	appendLine: (path, line) => fs.appendFileSync(path, line + os.EOL),
	filesIn: (directory) => fs.readdirSync(directory)

};


const getPublicFunctions = (obj) => Object
	.getOwnPropertyNames(obj.__proto__)
	.filter(prop => prop !== 'constructor' && prop !== 'initialize' && prop[0] !== '_' && typeof obj[prop] === 'function')
	.map(fnName => [ obj[fnName], fnName ]);

const debug = (obj) => getPublicFunctions(obj)
	.forEach(([ fn, fnName ]) => {
		obj[fnName] = (options) => {
			console.time(fnName);
			console.log(fnName + ' ' + JSON.stringify(options || {}));
			fn.call(obj, options);
			console.timeEnd(fnName);
		}
	});


class SortedArray {

	constructor() {
		this.changed = true;
	}

	get array () {
		return this._array;
	}

	set array (value) {
		this._array = value.sort();
		this.changed = true;
	}

	insert (sortedIndex, element) {
		this.array.splice(sortedIndex, 0, element)
		this.changed = true;
	}

	remove (value) {
		const index = this.array.indexOf(value);
		if (index > -1) {
			this.array.splice(index, 1);
			this.changed = true;
		}
	}

	sortedIndexOf (value) {

		let index = null;

		// TODO rewrite with binary search
		for (let i = 0; i++; i < this.array.length) {
			const el = this.array[i];
			if (value === el) {
				return -1;
			} else if (value < el && index === null) {
				index = i;
			}
		}

		return index === null ? this.array.length : index;
	}

	indexOf (value) {
		return this.array.indexOf(value);
	}

}

class I18n {

	constructor (config) {
		this.initialize(config); // making possible override constructor if needed
	}

	initialize (config) {

		this._config = Object.assign({}, ConfigDefaults, config);

		this._resetState();

		if (this._config.debug) {
			debug(this);
		}

		getPublicFunctions(this)
			.forEach(([ fn, fnName ]) => {
				this[fnName] = (options = {}) => {
					this._validateAction(fnName);
					fn.call(this, options);
				}
			});
	}

	_resetState () {

		delete this.state;

		this.state = {
			keys: new SortedArray(),
			updates: undefined,
			original: undefined,
			updated: {},
			error: null,
			loaded: false
		}

		this._resetUpdates();
	}

	_resetUpdates () {

		this.state.updates = {
			length: 0,
			before: {},
			after: {}
		}

		this.state.original = this.state.updated;
		this.state.updated = {};
	}

	_cloneState () {
		return Object.assign({},
			this.state,
			{
				files: this._findI18nFiles(),
				keys: {
					array: this.state.keys.array,
					changed: this.state.keys.changed
				}
			}
		);
	}

	_validateAction (fnName) {

		if (fnName === 'load') {
			return; // not validating
		}

		if (!this.state.loaded) {
			throw WtfError();
		}

		if (this.state.error) {
			throw new NotResolvedError(this.state.error);
		}

	}

	_isUpdateLine (line) {
		return line[0] === UpdateLine;
	}

	_parseLine (line, typeIndex) {

		const type = line[typeIndex];

		if (type !== CommentLine && type !== ApprovedLine && type !== NotApprovedLine && type !== DeleteKeyLine) {
			throw new InvalidLineError(line);
		}

		const separatorIndex = line.indexOf(KeyValueSeparator);
		if (separatorIndex <= typeIndex) {
			throw new InvalidLineError(line);
		}

		const key = line.substring(typeIndex + 1, separatorIndex);

		return {
			type: type,
			key,
			value: line.substring(separatorIndex + 1)
		}
	}

	// can be without optimizations as usually file don't have a lot updates
	_updateState (fileName, line) {

		if (!_isUpdateLine(line)) {
			throw new WtfError();
		}

		const { updates } = this.state;

		const parsedLine = this._parseLine(line, 1);
		const fullKey = FullKey(fileName, parsedLine.key);

		updates.length++;
		updates.before[fullKey] = this.state.original[fullKey];

		if (parsedLine.type === DeleteKeyLine) {
			delete updates.after[fullKey];
			delete this.state.updated[fullKey];
			this.state.keys.remove(parsedLine.key);
		} else {
			this._resolveTranslation(fullKey, parsedLine, state.updates.after);
		}
	}


	_resolveTranslation (fullKey, parsedLine, targetObject) {

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

		// always updating
		this.state.updated[fullKey] = translation;
	}

	// removing updates if they don't change the state
	_optimizeUpdates () {

		const { updates } = this.state;

		const updateKeys = new Set();
		Object.keys(updates.before).forEach(fullKey => updateKeys.add(fullKey));
		Object.keys(updates.after).forEach(fullKey => updateKeys.add(fullKey));

		updateKeys.forEach((fullKey) => {
			const original = this.state.original[fullKey];
			const updated = this.state.updated[fullKey];
			if (original && updated && original.comment === updated.comment && original.value === updated.value && original.approved === updated.approved) {
				delete updates.before[fullKey];
				delete updates.after[fullKey];
			}
		});

		const newUpdateKeys = new Set();
		Object.keys(updates.before).forEach(fullKey => newUpdateKeys.add(fullKey));
		Object.keys(updates.after).forEach(fullKey => newUpdateKeys.add(fullKey));
		updates.length = newUpdateKeys.size;

	}

	_findFiles (extension) {

		const { directory } = this._config;

		if (!directory) {
			throw new I18nError(ErrorCodes.InvalidDirectory, 'Directory parameter is undefined');
		}

		if (!fs.existsSync(directory)) {
			throw new I18nError(ErrorCodes.InvalidDirectory, `Directory don't exist: ${directory}`);
		}

		return this._config
			.filesIn(directory)
			.filter(name => name.endsWith(extension))
			.map(name => ({ name, path: join(directory, name) }));
	}

	_findI18nFiles () { return this._findFiles('.i18n') };
	_findI18nJsFiles () { return this._findFiles('.i18n.js') };

	_pathTo (fileName) {
		return path.join(this._config.directory, fileName);
	}

	_appendUpdate (fileName, line) {

		const updateLine = UpdateLine + line;

		this._updateState(fileName, updateLine);
		this._optimizeUpdates();
		// TODO turn off file-change listeners
		console.log('appendLine start');
		this._config.appendLine(this._pathTo(fileName), updateLine);
		console.log('appendLine end');
	}

	_triggerChange () {

		if (!this._connected || !this._onChange || this._triggeringChange) {
			return;
		}

		this._triggeringChange = true; // debouncing

		setTimeout(() => {

			try {
				this._onChange(this._cloneState());
			} finally {
				delete this._triggeringChange;
				this.state.keys.updated = false;
			}

		}, 0);
	}

	load () {

		this._resetState();

		try {

			const keys = new Set();

			for (const file of this._findI18nFiles()) {

				const reader = this._config.lineReader(file.path);

				// making sure that file don't have duplicated keys
				const valueKeys = new Set();
				const commentKeys = new Set();

				let lineNumber = 0;
				let line;
				const updates = [];

				while (line = reader.next()) {

					lineNumber++;

					if (line === undefined) {
						continue;
					}

					if (this._isUpdateLine(line)) {
						updates.push(line); // update-lines should be handled in the end
						continue;
					}

					try {

						// don't move to separate function, should be only here to reduce amount of validations
						const parsedLine = this._parseLine(line, 0);
						const fullKey = FullKey(file.name, parsedLine.key);
						this._resolveTranslation(fullKey, parsedLine, this.state.original);

						const targetSet = parsedLine.type === CommentLine ? commentKeys : valueKeys;
						if (targetSet.has(parsedLine.key)) {
							throw new DuplicateKeyError(parsedLine.type + parsedLine.key);
						} else {
							keys.add(parsedLine.key);
							targetSet.add(parsedLine.key);
						}

					} catch (e) {

						// adding more info
						if (e.stateError) {
							e.message = `[${fileName}:${lineNumber}] ` + e.message;
						}

						throw e;
					}

				}

				reader.close();

				for (const line of updates) {
					this._updateState(fileName, line);
				}

			}

			this._optimizeUpdates();
			this.state.keys.array = Array.from(keys.values());

		} catch (e) {
			if (e.stateError) {
				this.state.error = e;
			} else {
				throw e;
			}
		}
		finally {
			this.state.loaded = true;
		}

		this._triggerChange();
	}

	// important to make updates to local files under development
	// save state to fs (current state - with updates)
	save () {

		const files = this._findI18nFiles()
			.map(file => ({ name: file.name, writer: this._config.lineWriter(file.path) }));

		for (const key of this.state.keys.array) {

			let hasComment = false;

			for (const file of files) {
				const fullKey = FullKey(file.name, key);
				const t = this.state.updated[fullKey] || {};
				hasComment = hasComment || (t.comment && t.comment.length > 0);
				file.t = t;
			}

			for (const file of files) {

				const { approved = false, value = '', comment = '' } = file.t;

				if (hasComment) {
					file.writer.next(CommentLine + key + KeyValueSeparator + comment);
				}

				file.writer.next((approved ? ApprovedLine : NotApprovedLine) + key + KeyValueSeparator + value);
			}
		}

		files.forEach(file => { file.writer.close(); })

		this._resetUpdates();
		this._triggerChange();

		setTimeout(() => this.export({ type: 'save' }));
	}

	addFile ({ fileName = '' }) {

		if (this.state.updates.length) {
			throw new UnappliedChangesError();
		}

		if (fileName.length <= 0) {
			throw new I18nError(ErrorCodes.InvalidFile, `File name can't be empty`);
		}

		if (this._findI18nFiles().some(file => file.name === fileName)) {
			throw new I18nError(ErrorCodes.InvalidFile, `File with name "${fileName}" already exist`);
		}

		try {
			fs.closeSync(fs.openSync(this._pathTo(fileName), 'w'));
		} catch (e) {
			throw new I18nError(ErrorCodes.InvalidFile, e.message);
		}

		this.save();
	}

	deleteFile ({ fileName = '' }) {

		if (this.state.updates.length) {
			throw new UnappliedChangesError();
		}

		if (!this._findI18nFiles().some(file => file.name === fileName)) {
			return;
		}

		try {
			fs.unlinkSync(this._pathTo(fileName));
		} catch(e) {
			throw new I18nError(ErrorCodes.InvalidFile, e.message);
		}

		this.save();
	}

	addKey ({ key }) {

		const sortedIndex = this.state.keys.sortedIndexOf(key);
		if (sortedIndex === -1) {
			throw new KeyExistError(key);
		}

		const files = this._findI18nFiles();
		if (files.length == 0) {
			throw new NoI18nFilesError();
		}

		this.state.keys.insert(sortedIndex, key);

		for (const file of files) {
			this.updateValue(file.name, key);
		}

		this._triggerChange();
	}

	copyKey ({ fromKey, toKey }) {

		const files = this._findI18nFiles();
		if (files.length == 0) {
			throw new NoI18nFilesError();
		}

		if (this.state.keys.indexOf(fromKey) === -1) {
			throw new KeyNotExistError(fromKey);
		}

		const sortedIndex = this.state.keys.sortedIndexOf(toKey);
		if (sortedIndex === -1) {
			throw new KeyExistError(toKey);
		}

		this.state.keys.insert(sortedIndex, toKey);

		for (const file of files) {
			const fullKey = FullKey(file.name, fromKey);
			const t = this.state.updated[fullKey] || {};
			this.updateValue(file.name, toKey, t.value, t.approved);
			if (t.comment && t.comment.trim() !== '') {
				this.updateComment(file.name, key, t.comment);
			}
		}

		this._triggerChange();
	}

	renameKey ({ fromKey, toKey }) {
		this.copyKey({ fromKey, toKey });
		this.deleteKey({ fromKey });
	}

	deleteKey ({ key }) {

		this.state.keys.remove(key);

		for (const file of this._findI18nFiles()) {
			this._appendUpdate(file.name, DeleteKeyLine + key);
		}

		this._triggerChange();
	}

	updateValue ({ fileName, key, value = '', approved = false }) {
		const line = (approved ? ApprovedLine : NotApprovedLine) +  key + KeyValueSeparator + value.replace(/\n/g, '\\n');
		this._appendUpdate(fileName, line);
		this._triggerChange();
	}

	updateComment ({ fileName, key, comment = '' }) {
		const line = CommentLine + key + KeyValueSeparator + comment.replace(/\n/g, '\\n');
		this._appendUpdate(fileName, line);
		this._triggerChange();
	}

	updateTranslation ({ fileName, key, value = '', comment = '', approved = false }) {
		const commentLine = (approved ? ApprovedLine : NotApprovedLine) +  key + KeyValueSeparator + value.replace(/\n/g, '\\n');
		const valueLine = CommentLine + key + KeyValueSeparator + comment.replace(/\n/g, '\\n');
		this._appendUpdate(fileName, commentLine);
		this._appendUpdate(fileName, valueLine);
		this._triggerChange();
	}

	connect ({ onChange }) {

		if (this.state.loaded) {
			throw new WtfError();
		}

		this.load();

		this._connected = true;
		this._onChange = onChange;

		this._ignoreFileChanges = false;

		const watcher = fs.watch(this._config.directory, undefined, (e) => {

			// Listeners: disable before save
			// listen directory changes
			// listen file changes

			console.log('directory changed', e);

			if (!this._ignoreFileChanges) {
				this.load();
			}
		})

		return () => {
			// remove all listeners
			this._connected = false;
			watcher.close();
		}
 	}

	export ({ type = 'manual' } = {}) {


		if (!this._connected) {
			this.load();
		}

		if (!this.state.loaded) {
			throw new WtfError();
		}

		if (this.state.error) {
			throw new NotResolvedError(this.state.error);
		}

		// export

		if (!this._connected) {
			this._resetState();
		}
	}

}

const i18n = new I18n({ directory: './tests/huge' });

//i18n.connect();
//i18n.save();
i18n.load();

console.log('Keys:' + i18n.state.keys.array.length);


export { I18n, ErrorCodes, FullKey }

export default I18n;
