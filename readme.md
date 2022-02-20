# a-i18n-node

> Developer-friendly i18n

```
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

TODO V2

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
INT = (() => {

	const fs = require('fs');

	return {
		open: (exportType, fileName) => {},
		write: (openResult, translation) => {},
		close: (openResult, locale) => {}
	};

})();
```


## Install

```
$ npm install a-i18n-node

```
