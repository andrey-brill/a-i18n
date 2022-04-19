## a-i18n-node

> Developer-friendly i18n

Flat-files internationalization database.

__Example:__

```
/welcome.text=It's my comment to the Hello World multi-line text
-welcome.text=Hello,\_World!
+welcome.approved.quote=If It Works Don't Touch It.
```

### Spread

- __node__ - core for NodeJs
- __vscode__ - plugin for VS Code [Coming soon](#)
- __webpack__ - plugin for Webpack [Coming soon](#)

### Main features

- One text - one line
  - less git-conflicts as it makes easier to git execute merges
- Text-key is always on the same line in all _.i18n_ files
  - possible editing file without any external editor
  - `\n` will be replaced with `\_` (spell checking works correctly)
- Comment line `/`
  - context of text, improve translation
- Approved mark `+` or `-`
  - approves follows texts
  - additional check if approved text was changed
- Backlogging updates `*...`
  - merging will be blocked until updates not saved
- Exporter `.i18n.js`
  - any format of i18n can be supported to combine with other `t(key)`-libs
  - any prof-reading services can be used
- CLI
  - `npm link` && `a-i18n "I18n({ directory: './tests/huge', debug: true }) & load() & export({ type: 'custom' })"`
  - `npm run cli load() & export({ type: 'custom' })"`
  - `node ./cli.js "I18n({ autoExport: true }) & load()"`

> __NB!__ If you don't use any CI or build-processing you will probably need one

### How to start using a-i18n?

- Develop and run converter from existing format to `.i18n`
- Develop exporter `.i18n.js` to required format
- With CI:
  - Add exported files and directory to `.gitignore`
  - Add build step to CI to export texts on `build` or `push`
- Without CI:
  - Use [__vscode__](#) plugin

### Specification

I18n-file name:

```js
/^(.*[^a-zA-Z])?([a-z][a-z])(-[A-Z][A-Z])?\.i18n$/ // BCP 47
```

I18n-file line:

```js
/^\*?[+-/#]([^=]+)=(.*)$/
// match.group[1] == key
// match.group[2] == value
```

Legend of symbols:

- `=` - key-value separator
- `\_` - new line symbol
- `/` - comment line
- `+` - approved text line
- `-` - not approved text line
- `*` - incoming updates
  - `#` - delete line

## Install

```
$ npm install a-i18n-node
```
