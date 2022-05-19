
import vscode, { Uri } from 'vscode';

import { Disposable } from './Disposable.js';

import editorJs from '../../editor/lib/editor.dist.js';
import editorHtml from '../../editor/lib/editor.html';
import logo from '../svg/logo.svg';


const DefaultUI = {
  query: '',
  selectedKey: null
};

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
    panel.webview.html = editorHtml.replace('{}', editorJs);
    this.dis$(panel.onDidDispose(() => {
      this.resetPanel$();
    }));

    this.dis$(panel.webview.onDidReceiveMessage((message) => {
      console.log('panel.webview', message);
      // if needed (not action)
      this.updatePanel$();
    }));

    this.panel = panel;
    this.updatePanel$();
  }

  setTitle$(title) {
    if (this.panel) {
      this.panel = title;
    }
  }

  updatePanel$() {
    if (this.state && this.panel) {
      const prepared = Object.assign({}, this.ui);
      // TODO prepare this.state based on this.ui
      this.panel.webview.postMessage(prepared);
    }
  }

  connect() {

    if (this.unsubscribe) {
      throw new Error('WTF?');
    }

    const options = {
      onChange: (state) => {
        this.state = state;
        this.updatePanel$();
      }
    };

    return this.i18n.connect(options)
      .then(unsubscribe => {
        this.dis$(unsubscribe);
      });
  }

  dispose() {
    super.dispose();
    this.state = null;
    this.resetPanel$();
  }

  resetPanel$() {
    this.panel = null;
    this.ui = Object.assign({}, DefaultUI);
  }
}
