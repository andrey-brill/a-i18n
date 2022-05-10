## a-i18n

> Developer-friendly i18n

Flat-files internationalization database.

__Example:__

```
/welcome.text=It's my comment to the Hello World multi-line text
-welcome.text=Hello,\_World!
+welcome.approved.quote=If It Works Don't Touch It.
```

### Spread

- __[node](a-i18n-node)__ - core for NodeJs
- __[vscode](a-i18n-vscode)__ - plugin for VS Code
- __[webpack](a-i18n-webpack)__ - plugin for Webpack

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
  - give additional check if approved text was changed
- Backlogging updates in `@en.i18n`
  - git pull can be done during editing texts
- Exporter `.i18n.js`
  - any format of i18n can be supported to combine with other `t(key)`-libs
  - any prof-reading services can be used

### How to start using a-i18n?

- Convert current translations to `.i18n` files
- Develop exporter `.i18n.js` to required format(s)
- With CI:
  - Add exported files and directory to `.gitignore`
  - Add build step to CI to export texts on `build` or `push`
- Without CI:
  - Use [vscode](a-i18n-vscode) plugin

### Specification

I18n-file name:

```js
const FileName = /^(.*[^a-zA-Z])?([a-z][a-z])(-[A-Z][A-Z])?\.i18n$/ // BCP 47
const BackLogFileName =
// en.i18n
// en-GB.i18n
// client_en-US.i18n
```

I18n-file line:

```js
const KeyValue = /^[+-/#]([^=]+)=(.*)$/
// match.group[1] == key
// match.group[2] == value
```

Legend of symbols:

- `=` - key-value separator
  - `\_` - new line symbol in value
- `/` - comment line
- `+` - approved text line
- `-` - not approved text line
- `#` - delete line

### Coding Conventions

```js
class AClass {
  __init$() // abstract sync function
  _export() // private async function (promise)
  import$() // public sync function
}
```