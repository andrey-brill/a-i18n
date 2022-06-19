## a-i18n-core-js

> Common code for js-libraries


## Main code

### Ai18n.js

The core class that is managing the content of `.i18n` files.

Core functions:

- __load()__: loading content from `.i18n` files that is located in `config.directory`
- __connect()__: loading and listening on file changes to make auto-reload and auto-export
- __addKey({ key })__*: adding new translation key to all files
- __copyKey({ fromKey, toKey })__*: safe copying existing key
- __deleteKey({ key })__*: safe deleting key
- __applyChange({ locale, key, value, comment, approved })__*: safe applying changes
- __revertChanges({ locale?, key? })__*: safe revering changes
- __save()__: saving changes from `@.i18n` to `.i18n` files
- __export({type})__: exporting translations with exporter `.i18n.js`

* All safe-operations stores and makes changes in separate back-log files `@.i18n`


### Ai18n.parseLines.js

The core function to parse file lines in `a-i18n` format.

_Example:_

```js

const result = parseLines('+test.key=Approved translation\n/test.nextKey=My comment to nextKey\n-test.nextKey=Not approved translation')

/*

result = [
  { type: '+', key: 'test.key', value: 'Approved translation', approved: true },
  { type: '/', key: 'test.nextKey', comment: 'My comment to nextKey' },
  { type: '-', key: 'test.nextKey', value: 'Not approved translation', approved: false }
]

*/
```

