import vscode, { Uri } from 'vscode';

import { I18nConfig, initFromConfigs$, initFromResourcePath$, TypeDirectory, TypeFile } from './i18n/I18n.js';
import { errorHandler$, toPath$, toString$, toUniqueShortPath$ } from './Utils.js';
import { Disposable } from './Disposable.js';
import { I18nManager } from './I18nManager.js';
import { StatusBarManager } from './StatusBarManager.js';
import { Extension } from '../../core/constants.js';


const NotInitializedText = 'A-i18n extension not initialized yet';

export class ExtensionManager extends Disposable {

  constructor() {
    super();

    this.statusBarManager = new StatusBarManager();

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

  activate$(context) {

    this.dispose$();

    this.context = context;

    this.dis$(this.statusBarManager.init());

    this.dis$(vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.activate$();
    }));

    const toCommand$ = (commandFn) => (a, b, c) => {
      if (this.nonActiveReason) {
        if (this.nonActiveReason === NotInitializedText) {
          vscode.window.showInformationMessage(this.nonActiveReason);
        } else {
          vscode.window.showErrorMessage(this.nonActiveReason);
        }
      } else {
        try {
          commandFn.call(this, a, b, c);
        } catch (error) {
          errorHandler$(error);
        }
      }
    };

    this.dis$(vscode.commands.registerCommand(Extension + ".openFolder", toCommand$(uri => {
      this.openEditorByUri(uri, TypeDirectory);
    })));

    this.dis$(vscode.commands.registerCommand(Extension + ".openFile", toCommand$(uri => {
      this.openEditorByUri(uri, TypeFile);
    })));

    this.dis$(vscode.commands.registerCommand(Extension + ".open", toCommand$(() => {
      this.openEditor();
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
        const managers = i18ns.map(i18n => this.createManager$(i18n));

        this.nonActiveReason = null;

        // TODO remove
        this.openEditor();

        return Promise.all(managers.map(m => m.connect()));
      })
      .catch(e => {
        this.nonActiveReason = e.message;
        errorHandler$(e);
      })
  }

  openEditorByUri(uri, resourceType) {

    const rootFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!rootFolder) {
      throw new Error(`Can't resolve workspace folder for uri: ` + toString$(uri));
    }

    const rootPath = toPath$(rootFolder);
    const resourcePath = resourceType === TypeFile ? toString$(uri) : toPath$(uri);

    const i18n = initFromResourcePath$(rootPath, resourcePath, resourceType, this.configDefaults);

    let manager = this.managers[i18n.fullPath$()];

    if (!manager) {

      manager = this.createManager$(i18n);

      i18n.saveConfig();
      newManager.connect();
    }

    manager.showPanel$();
    this.updateTitles$();
  }

  openEditor() {

    const paths = Object.keys(this.managers);

    if (paths.length === 1) {
      this.openEditorByUri(Uri.parse(paths[0]), TypeDirectory);
    } else if (paths.length > 1) {

      const shorts = toUniqueShortPath$(paths);
      const items = paths.map(p => ({ label: shorts[p], detail: p }));

      vscode.window.showQuickPick(items, { canPickMany: false })
        .then(selected => {
          if (selected) {
            this.openEditorByUri(Uri.parse(selected.detail), TypeDirectory);
          }
        });
   }
  }

  dispose$() {
    this.dispose();
    this.managers = {};
    this.nonActiveReason = NotInitializedText;
  }

  createManager$(i18n) {

    const manager = new I18nManager(this.context, i18n)
    this.dis$(manager);

    if (this.managers[manager.path]) {
      throw new Error('WTF?');
    }

    this.managers[manager.path] = manager;
    this.onManagersChanged$();

    return manager;
  }

  onManagersChanged$() {
    this.statusBarManager.update(Object.keys(this.managers));
  }

  updateTitles$() {

    const paths = Object.keys(this.managers);
    const shortPaths = toUniqueShortPath$(paths)

    for (const fullPath of paths) {
      this.managers[fullPath].setTitle$(shortPaths[fullPath]);
    }
  }
}
