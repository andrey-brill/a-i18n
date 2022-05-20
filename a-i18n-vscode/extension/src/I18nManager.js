
import vscode, { Uri } from 'vscode';

import { Disposable } from './Disposable.js';
import { buildFK$ } from './i18n/I18n.js';

import editorJs from '../../editor/lib/editor.dist.js';
import editorHtml from '../../editor/lib/editor.html';
import logo from '../svg/logo.svg';



const DefaultUI = {
  query: '',
  selectedKey: null
};

const KeysLimit = 50;

export class I18nManager extends Disposable {

  constructor(i18n) {
    super();
    this.i18n = i18n;
    this.path = i18n.fullPath$();
    this.dispose();
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

      if (message.type === 'READY') {
        this.updatePanel$();
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

      const { keys, files, updated } = this.state;

      const prepared = Object.assign({ type: 'UPDATE' }, this.ui);
      prepared.loaded = this.state.loaded;
      prepared.error = this.state.error;
      prepared.updates = this.state.updates;

      if (prepared.selectedKey) {

        const selectedValue = {};
        for (const file of files) {
          const fullKey = buildFK$(file.name, prepared.selectedKey);
          selectedValue[file.locale] = updated[fullKey];
        }

        prepared.selectedValue = selectedValue;
      }

      const query = prepared.query.trim();
      if (this.previousPrepared.query !== query || keys.changed) {

        const keysInfo = {};
        let keysInfoSize = 0;
        for (const key of keys.array) {

          if (key.indexOf(query) >= 0) {

            keysInfoSize++;

            keysInfo[key] = {
              approved: 0,
              filled: 0
            };

            if (keysInfoSize >= KeysLimit) {
              break;
            }
          }
        }

        prepared.keysInfo = keysInfo;
        prepared.keysInfoReachLimit = keysInfoSize === KeysLimit;
      }

      // calculating keysInfo
      for (const key of Object.keys(prepared.keysInfo)) {

        const info = prepared.keysInfo[key];

        for (const file of files) {
          const fullKey = buildFK$(file.name, key);
          const t = updated[fullKey];
          if (t && t.approved) info.approved++;
          if (t && t.value && t.value.trim().length > 0) info.filled++;
        }

        info.approved = info.approved / files.length;
        info.filled = info.filled / files.length;
      }

      this.previousPrepared = prepared;

      // postMessage works in single tread, thus it wait while React is rendering
      this.panel.webview.postMessage(prepared);
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
    this.previousPrepared = {};
    this.ui = Object.assign({}, DefaultUI);
  }
}
