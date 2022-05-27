
import vscode, { Uri } from 'vscode';

import { Disposable } from './Disposable.js';
import { buildFK$ } from './i18n/I18n.js';

import editorJs from '../../editor/lib/editor.dist.js';
import editorHtml from '../../editor/lib/editor.html';
import logo from '../svg/logo.svg';
import { KeyState, MessageTypes } from '../../core/constants.js';



const DefaultUI = {
  query: '',
  selectedKey: null
};

const KeysLimit = 50;

function resolveKeyState (key, locales, keys, updates) {

  if (!updates.keys.has(key)) {
    return keys.has(key) ? KeyState.Original : KeyState.Deleted;
  }

  const states = [];
  for (const locale of locales) {

    const fk = buildFK$(locale, key);
    const before = updates.before[fk];
    const after = updates.after[fk];

    if (before && !after) {
      states.push(KeyState.Deleted);
    } else if (after && !before) {
      states.push(KeyState.New);
    } else {
      return KeyState.Updated;
    }
  }

  return states[0];
}


function buildUpdate(previousUpdate = {}, ui, i18n) {

  const { keys, origins, locales, updates, loaded, error } = i18n.state;

  const update = Object.assign({ type: MessageTypes.Update, loaded, error });

  if (!update.loaded || update.error) {
    return update;
  }

  const updatedKeys = {};
  for (const key of updates.keys) {
    updatedKeys[key] = resolveKeyState(key, locales, keys, updates);
  }
  update.updatedKeys = updatedKeys;

  const { selectedKey, query } = ui;

  if (selectedKey) {

    update.selectedKey = selectedKey;
    update.selectedState = resolveKeyState(selectedKey, locales, keys, updates);

    let previous = null;
    let current = null;

    switch (update.selectedState) {
      case KeyState.Original:
        current = origins;
        break;
      case KeyState.New:
        current = updates.after;
        break;
      case KeyState.Updated:
        previous = updates.before;
        current = updates.after;
        break;
    }

    const selectedPrevious = {};
    const selectedCurrent = {};

    for (const locale of locales) {

      const fk = buildFK$(locale, selectedKey);
      selectedPrevious[locale] = previous ? previous[fk] : null;
      selectedCurrent[locale] = current ? current[fk] : null;
    }

    update.selectedCurrent = selectedCurrent;
    update.selectedPrevious = selectedPrevious;

  }

  if (previousUpdate.query !== query || keys.changed) {

    const keysInfo = {};
    let keysInfoSize = 0;
    for (const key of keys.array) {

      if (key.indexOf(query) >= 0) {

        keysInfoSize++;
        keysInfo[key] = true;

        if (keysInfoSize >= KeysLimit) {
          break;
        }
      }
    }

    update.keysInfoReachLimit = keysInfoSize === KeysLimit;
    update.keysInfo = keysInfo;
    update.query = query;
  }


  if (update.keysInfo) {

    for (const key of Object.keys(update.keysInfo)) {

      const info = {
        approved: 0,
        filled: 0
      };

      for (const locale of locales) {
        const t = i18n.getT$(buildFK$(locale, key));
        if (t && t.approved) info.approved++;
        if (t && t.value && t.value.length > 0) info.filled++;
      }

      info.approved = info.approved / locales.length;
      info.filled = info.filled / locales.length;

      update.keysInfo[key] = info;
    }
  }

  return update;
}

export class I18nManager extends Disposable {

  constructor(context, i18n) {
    super();

    this.context = context;
    this.i18n = i18n;
    this.path = i18n.fullPath$();
    this.dispose();
  }

  _buildInit$() {

    const message = { type: MessageTypes.Init, workspaceState: {} };

    for (const key of this.context.workspaceState.keys()) {
      message.workspaceState[key] = this.context.workspaceState.get(key);
    }

    return message;
  }

  showPanel$() {

    if (this.panel) {
      this.panel.reveal();
      return;
    }

    const panel = this.dis$(vscode.window.createWebviewPanel("a-i18n-editor", "A-i18n", vscode.ViewColumn.One, {
      retainContextWhenHidden: true,
      enableScripts: true
    }));

    panel.iconPath = Uri.parse(logo);

    const script = editorJs.replace('"<script></script>"', '"<scr" + "ipt></scr" + "ipt>"'); // in react

    const templateParts = editorHtml.split('{}');
    if (templateParts.length !== 2) {
      throw new Error('WTF?');
    }

    panel.webview.html = templateParts.shift() + script + templateParts.shift(); // replace() not working sometimes

    this.dis$(panel.onDidDispose(() => {
      this.resetPanel$();
    }));

    this.dis$(panel.webview.onDidReceiveMessage((message) => {
      console.log('panel.webview', message);

      if (message.type === MessageTypes.Ready) {
        this.postMessage$(this._buildInit$())
        this.updatePanel$();
      }

      if (message.type === MessageTypes.UpdateWorkspaceState) {
        for (const key of Object.keys(message)) {
          if (key !== 'type') {
            this.context.workspaceState.update(key, message[key]);
          }
        }
      }
    }));

    this.panel = panel;
  }

  setTitle$(title) {
    if (this.panel) {
      this.panel.title = title;
    }
  }

  updatePanel$() {
    if (this.i18n && this.panel) {
      const nextUpdate = buildUpdate(this.previousUpdate, this.ui, this.i18n);
      this.postMessage$(nextUpdate);
      this.previousUpdate = nextUpdate;
    }
  }

  postMessage$(message) {

    if (!message) {
      throw new Error('postMessage$.message is undefined!')
    }

    if (this.panel) {
      // postMessage works in single tread, thus it wait while React is rendering
      console.log('postMessage', message.type, message);
      this.panel.webview.postMessage(message);
    } else {
      console.error("Can't post message", message);
    }
  }

  connect() {

    if (this.unsubscribe) {
      throw new Error('WTF?');
    }

    return this.i18n.connect({ onChange: () => this.updatePanel$() })
      .then(unsubscribe => {
        if (unsubscribe) { // can be undefined on catch error
          this.dis$(unsubscribe);
          return this.i18n.load();
        }
      });
  }

  dispose() {
    super.dispose();
    this.resetPanel$();
  }

  resetPanel$() {
    this.panel = null;
    this.previousUpdate = {};
    this.ui = Object.assign({}, DefaultUI);
  }
}
