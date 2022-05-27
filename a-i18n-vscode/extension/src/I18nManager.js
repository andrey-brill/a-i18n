
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


function buildUpdate(previousUpdate = {}, state, ui, i18n) {

  const { keys, files, updated, origins, updates } = state;

  const update = Object.assign({ type: MessageTypes.Update }, ui);
  update.loaded = state.loaded;

  if (!update.loaded) {
    return update;
  }

  update.error = state.error;

  if (update.error) {
    return update;
  }

  //
  // update.updates = state.updates;

  const updateKeys = i18n._updatesFKs$();

  // resolve updated keys states
  const updatedKeys = {};
  for (const updatedKey of updateKeys) {

    const before = updates.before[updatedKey];
    const after = updates.after[updatedKey];

  }

  update.updatedKeys = updatedKeys;

  if (update.selectedKey) {

    if (!i18n.state.keys.has(update.selectedKey)) {
      update.selectedState = KeyState.Deleted
    } else {

      const selectedValue = {};
      const selectedOrigin = {};


      let hasOrigins = false;
      let hasUpdates = false;

      for (const file of files) {

        const fullKey = buildFK$(file.name, update.selectedKey);

        selectedValue[file.locale] = updated[fullKey];
        selectedOrigin[file.locale] = origins[fullKey];

        if (origins[fullKey]) {
          hasOrigins = true;
        }

        if (updateKeys.has(fullKey)) {
          hasUpdates = true;
        }

      }

      update.selectedState = !hasOrigins ? KeyState.New : (hasUpdates ? KeyState.Updated : KeyState.Original);
      update.selectedOrigin = hasOrigins ? selectedOrigin : null;
      update.selectedValue = selectedValue;

    }
  }

  const query = update.query.trim();
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

    update.keysInfo = keysInfo;
    update.keysInfoReachLimit = keysInfoSize === KeysLimit;
  }


  if (update.keysInfo) {

    for (const key of Object.keys(update.keysInfo)) {

      const info = {
        approved: 0,
        filled: 0
      };

      for (const file of files) {
        const fullKey = buildFK$(file.name, key);
        const t = updated[fullKey];
        if (t && t.approved) info.approved++;
        if (t && t.value && t.value.length > 0) info.filled++;
      }

      info.approved = info.approved / files.length;
      info.filled = info.filled / files.length;

      update.keysInfo[key] = info;
    }
  }

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
    if (this.state && this.panel) {
      const nextUpdate = buildUpdate(this.previousUpdate, this.state, this.ui, this.i18n);
      this.postMessage$(nextUpdate);
      this.previousUpdate = nextUpdate;
    }
  }

  postMessage$(message) {
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

    const options = {
      onChange: (state) => {
        console.log('onChange', !!state);
        this.state = state;
        this.updatePanel$();
      }
    };

    return this.i18n.connect(options)
      .then(unsubscribe => {
        if (unsubscribe) { // can be undefined on catch error
          this.dis$(unsubscribe);
          return this.i18n.load();
        }
      });
  }

  dispose() {
    super.dispose();
    this.state = null;
    this.resetPanel$();
  }

  resetPanel$() {
    this.panel = null;
    this.previousUpdate = {};
    this.ui = Object.assign({}, DefaultUI);
  }
}
