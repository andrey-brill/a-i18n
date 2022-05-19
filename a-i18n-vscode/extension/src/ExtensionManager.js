import vscode, { Uri } from 'vscode';

import { I18nConfig, initFromConfigs$, initFromResourcePath$, TypeDirectory, TypeFile } from './i18n/I18n.js';
import { errorHandler$, toPath$, toUniqueShortPath$ } from './Utils.js';
import { Disposable } from './Disposable.js';
import { I18nManager } from './I18nManager.js';


export class ExtensionManager extends Disposable {

  constructor() {
    super();

    this.configDefaults = {
      errorHandler: errorHandler$,
      exportHandler: (result, isError) => {
        if (isError) {
          errorHandler$(result);
        } else {
          if (result) {
            vscode.window.showInformationMessage(result.toString());
          }
        }
      },
    }
  }

  connect$() {

    this.dispose$();

    this.dis$(vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.connect$();
    }));

    const toCommand$ = (commandFn) => (a, b, c) => {
      if (this.nonActiveReason) {
        vscode.window.showErrorMessage(this.nonActiveReason);
      } else {
        try {
          commandFn.call(this, a, b, c);
        } catch (error) {
          errorHandler$(error);
        }
      }
    };

    this.dis$(vscode.commands.registerCommand("a-i18n-vscode.openFolder", toCommand$(uri => {
      this.openEditor(uri, TypeDirectory);
    })));

    this.dis$(vscode.commands.registerCommand("a-i18n-vscode.openFile", toCommand$(uri => {
      this.openEditor(uri, TypeFile);
    })));

    const hasFolders = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0;
    if (!hasFolders) {
      this.nonActiveReason = `Can't activate A-i18n extensions in workspace without folders`;
      return;
    }

    Promise.all(vscode.workspace.workspaceFolders.map(folder => {
      return vscode.workspace.fs.readDirectory(folder.uri)
        .then(files => files.filter(file => file[0] === I18nConfig && file[1] === TypeFile)[0])
        .then(file => {
          if (file) {
            return vscode.workspace.fs.readFile(Uri.parse(toPath$(folder) + file[0]))
              .then(content => [folder, JSON.parse(content)]);
          } else {
            return null;
          }
        });
    }))
      .then((configInfos = []) => {

        const configFiles = {};
        configInfos.filter(configInfo => !!configInfo).forEach(configInfo => {
          configFiles[toPath$(configInfo[0])] = configInfo[1];
        });

        if (Object.keys(configInfos).length === 0) {
          return true;
        }

        const i18ns = initFromConfigs$(configFiles, this.configDefaults);
        const managers = i18ns.map(i18n => createManager(i18n));

        this.updateTitles$();

        this.nonActiveReason = null;

        return Promise.all(managers.map(m => m.connect()));
      })
      .catch(e => {
        this.nonActiveReason = e.message;
        errorHandler$(e);
      })
  }

  openEditor(uri, resourceType) {

    console.log('openEditor', uri, resourceType);

    const rootFolder = vscode.workspace.getWorkspaceFolder(uri);

    // TODO debug
    const rootPath = toPath$(rootFolder);
    const resourcePath = toPath$(uri);

    const i18n = initFromResourcePath$(rootPath, resourcePath, resourceType, this.configDefaults);

    const manager = this.managers[i18n.fullPath$()];
    if (manager) {
      return manager.showPanel$()
    }

    const newManager = this.createManager(i18n);
    newManager.showPanel$()
    this.updateTitles$();

    i18n.saveConfig();
    newManager.connect()
  }

  dispose$() {
    this.dispose();
    this.managers = {};
    this.nonActiveReason = 'A-i18n extension not initialized yet';
  }

  createManager(i18n) {

    const manager = new I18nManager(i18n)
    this.dis$(manager);

    if (this.managers[manager.path]) {
      throw new Error('WTF?');
    }

    this.managers[manager.path] = manager;

    return manager;
  }

  updateTitles$() {
    const shortPaths = toUniqueShortPath$(Object.keys(this.managers))
    for (const fullPath of Object.keys(shortPaths)) {
      this.managers[fullPath].setTitle$(shortPaths[fullPath]);
    }
  }
}
