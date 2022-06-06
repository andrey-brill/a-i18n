
import vscode, { Uri } from 'vscode';

import { Disposable } from './Disposable.js';
import { buildFK, strNotEmpty } from './i18n/I18n.js';

import editorJs from '../../editor/lib/editor.dist.js';
import editorHtml from '../../editor/lib/editor.html';
import icon from '../svg/page-icon.svg';
import { Action, ActionProperty, Extension, Preferences, workspaceKey } from '../../core/constants.js';



const DefaultUI = {
  query: '',
  selectedKey: null,
  selectedForce: false // force selected key translations to hard update on State change
};

const KeysLimit = 50;


function getConfiguration() {
  return vscode.workspace.getConfiguration(Extension);
}


function buildPreferences(context) {

  const workspaceState = {};

  const preferences = {};

  for (const key of context.workspaceState.keys()) {
    workspaceState[key] = context.workspaceState.get(key);
  }

  const configuration = getConfiguration();

  for (const key of Object.keys(Preferences)) {
    const wsValue = workspaceState[workspaceKey(key)];
    preferences[key] = wsValue !== null && wsValue !== undefined ? wsValue : configuration.get(key);
  }

  return preferences;
}


function buildState(previousState = {}, ui, i18n, context) {

  const { keys, locales, changes, loaded, error } = i18n.state;

  const state = Object.assign({ loaded, error }, ui);

  state.preferences = buildPreferences(context);
  state.autoExport = i18n.autoExport;

  if (!state.loaded || state.error) {
    return state;
  }

  const changedKeys = {};
  for (const key of changes.keys) {
    changedKeys[key] = i18n.getKeyState(key);
  }
  state.changedKeys = changedKeys;

  if (state.selectedKey) {
    state.selectedInfo = i18n.getKeyInfo(state.selectedKey);
  } else {
    delete state.selectedInfo;
  }

  let keysToRecalculate = [];
  if (!previousState || previousState.query !== state.query || keys.changed) {

    const keysInfo = {};
    let keysInfoSize = 0;
    for (const key of keys.array) {

      if (key.indexOf(state.query) >= 0) {

        keysInfoSize++;
        keysInfo[key] = true;

        if (keysInfoSize >= KeysLimit) {
          break;
        }
      }
    }

    state.keysInfoReachLimit = keysInfoSize === KeysLimit;
    state.keysInfo = keysInfo;
    keysToRecalculate = Object.keys(state.keysInfo);
  } else if (previousState) {
    state.keysInfoReachLimit = previousState.keysInfoReachLimit;
    state.keysInfo = previousState.keysInfo;
    keysToRecalculate = state.selectedKey ? [state.selectedKey] : keysToRecalculate;
  }


  if (state.keysInfo) {

    for (const key of keysToRecalculate) {

      const info = {
        approved: 0,
        filled: 0
      };

      for (const locale of locales) {
        const t = i18n.getT(buildFK(locale, key));
        if (t && t.approved) info.approved++;
        if (t && strNotEmpty(t.value)) info.filled++;
      }

      info.approved = info.approved / locales.length;
      info.filled = info.filled / locales.length;

      state.keysInfo[key] = info;
    }
  }

  return state;
}


export class I18nManager extends Disposable {

  constructor(context, i18n) {
    super();

    this.context = context;
    this.i18n = i18n;
    this.path = i18n.fullPath();
    this.dispose();
  }

  showPanel() {

    if (this.panel) {
      this.panel.reveal();
      return;
    }

    const panel = this.dis(vscode.window.createWebviewPanel("a-i18n-editor", "A-i18n", vscode.ViewColumn.One, {
      retainContextWhenHidden: true,
      enableScripts: true
    }));

    panel.iconPath = Uri.parse(icon);

    const script = editorJs.replace('"<script></script>"', '"<scr" + "ipt></scr" + "ipt>"'); // in react

    const templateParts = editorHtml.split('{}');
    if (templateParts.length !== 2) {
      throw new Error('WTF?');
    }

    panel.webview.html = templateParts.shift() + script + templateParts.shift(); // replace() not working sometimes

    this.dis(panel.onDidDispose(() => {
      this._resetPanel();
    }));

    this.dis(panel.webview.onDidReceiveMessage((message) => {
      this._handleAction(message[ActionProperty], message);
    }));

    this.panel = panel;
  }


  _handleAction(action, data) {

    switch(action) {

      case Action.State:
        return this._postState();

      case Action.Query:
        this.ui.query = data.query;
        return this._postState();

      case Action.CheckKey:
        return this._post(Action.CheckKey, {
          key: data.key,
          exists: this.i18n.state.keys.has(data.key)
        });

      case Action.SelectKey:
        this.ui.selectedKey = data.key;
        return this._postState();

      case Action.AddKey:
        return this.i18n
          .addKey({ key: data.key })
          .then(() => this._handleAction(Action.SelectKey, data));

      case Action.CopyKey:
        return this.i18n
          .copyKey({ fromKey: data.fromKey, toKey: data.toKey })
          .then(() => this._postState());

      case Action.RenameKey:
        return this.i18n
          .copyKey({ fromKey: data.fromKey, toKey: data.toKey })
          .then(() => deleteKey({ key: data.fromKey }))
          .then(() => this._postState());

      case Action.ApplyChange:
        return this.i18n
          .applyChange(data.translation)
          .then(() => this._postState());

      case Action.RevertAllChanges:
      case Action.RevertChanges:
        return this.i18n
          .revertChanges({ key: data.key, locale: data.locale })
          .then(() => {
            this.ui.selectedForce = true;
            this._postState();
            this.ui.selectedForce = false;
          });

      case Action.DeleteKey:
        return this.i18n
          .deleteKey({ key: data.key })
          .then(() => this._postState());

      case Action.Preference:

        const { key, value, global = false, state = true } = data;

        let task = null;

        if (global) {
          task = getConfiguration().update(key, value, global)
        } else {
          task = this.context.workspaceState.update(workspaceKey(key), value);
        }

        return task.then(() => {
          if (state) this._postState();
        });


      case Action.AutoExport:
        this.i18n.autoExport = data.value;
        return this.i18n
          .saveConfig()
          .then(() => this._postState());

      case Action.SaveAndExport:
      case Action.Save:
        return this.i18n
          .save()
          .then(() => this._postState());
      case Action.Export:
        return this.i18n.export();
      default:
        throw new Error('Unknown action: ' + action);
    }
  }

  setTitle(title) {
    if (this.panel) {
      this.panel.title = title;
    }
  }

  _postState() {
    if (this.i18n && this.panel) {
      const nextState = buildState(this.previousState, this.ui, this.i18n, this.context);
      this._post(Action.State, nextState);
      this.previousState = nextState;
    }
  }

  _post(action, message) {

    if (!message || !action) {
      throw new Error('I18nManager._post.message is undefined!')
    }

    if (this.panel) {
      message[ActionProperty] = action;
      // postMessage works in single tread, thus it wait while React is rendering
      this.panel.webview.postMessage(message);
    } else {
      console.error("Can't post message", message);
    }
  }

  connect() {

    if (this.unsubscribe) {
      throw new Error('WTF?');
    }

    return this.i18n.connect({ onChange: () => this._postState() })
      .then(unsubscribe => {
        if (unsubscribe) { // can be undefined on catch error
          this.dis(unsubscribe);
          return this.i18n.load();
        }
      });
  }

  dispose() {
    super.dispose();
    this._resetPanel();
  }

  _resetPanel() {
    this.panel = null;
    this.previousState = {};
    this.ui = Object.assign({}, DefaultUI);
  }
}


