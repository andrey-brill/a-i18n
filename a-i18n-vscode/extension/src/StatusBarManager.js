
import vscode from 'vscode';


export class StatusBarManager {

  constructor() {
    this.dispose();
  }

  init() {
    const item = this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    item.command = "a-i18n-vscode.open";
    item.text = `$(symbol-parameter) A-i18n`;
    item.hide();
    return this;
  }

  update (paths = []) {
    if (this.item) {
      if (paths.length <= 0) {
        this.item.hide();
      } else {
        this.item.show();
      }
    }
  }

  dispose() {

    if (this.item) {
      this.item.dispose();
    }

    this.item = null;
  }

}