#!/usr/bin/env node
import { I18n } from '../index.js';


const [ _nodePath, _cliPath, ...commands ] = process.argv;

let actions = [];
for (const command of commands) {
  actions = actions.concat(command.split('&').map(action => action.trim()));
}

const init = actions.shift();

let i18n;
if (init && init.indexOf('I18n') === 0) {
  eval(`i18n = new ${init}`);
} else {
  i18n = new I18n();
  actions.unshift(init);
}

if (actions.length > 0) {
  const first = 'i18m.' + actions.shift();
  const next = actions.map(action => '.then(() => i18n.' + action + ')').join('');
  eval(first + next);
}

