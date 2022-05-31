

import { Ai18n, I18nConfig, RootDirectory, TypeFile, directoryFrom, endWithSlash, strIsEmpty } from '../../../../a-i18n-core-js/index.js';
import { FS } from './FS.js';


const ConfigPath = RootDirectory + I18nConfig;

function fullPath$ (rootPath, directory) {
  return endWithSlash(rootPath) + directory.substring(RootDirectory.length);
}

export class I18n extends Ai18n {

  _actions() {
    const actions = super._actions();
    actions.push(this.saveConfig);
    return actions;
  }

  __initializeFS () {
    return FS;
  }

  fullPath$() {
    return fullPath$(this._config.rootPath, this._config.directory);
  }

  saveConfig() {
    return this._fs.existFile(ConfigPath)
      .then((isExists) => {
        if (isExists) {
          return this._fs.readFile(ConfigPath);
        } else {
          return null;
        }
      })
      .then(content => {

        const contentJSON = strIsEmpty(content) ? '{}' : content;
        const i18nConfig = JSON.parse(contentJSON);

        const current = i18nConfig[this._config.directory] || {};
        i18nConfig[this._config.directory] = Object.assign(current, {
          autoExport: this.autoExport
        });

        return this._fs.writeFile(ConfigPath, JSON.stringify(i18nConfig, undefined, 2));
      })
  }

}


export function initFromConfigs$ (configFiles = {}, configDefaults = {}) {

  const result = {};

  Object.keys(configFiles).forEach(rootPath => {

    const configFile = configFiles[rootPath];

    Object.keys(configFile).forEach(directory => {

      const savedConfig = configFile[directory];
      const config = Object.assign({}, configDefaults, savedConfig, { rootPath, directory  })

      const fullPath = fullPath$(rootPath, directory);
      if (!result[fullPath]) {
        result[fullPath] = new I18n(config);
      }

    });

  })

  return Object.values(result);
}

export function initFromResourcePath$ (rootPath, resourcePath, resourceType, configDefaults = {}) {

  let directoryPath = resourcePath;
  if (resourceType === TypeFile) {
    directoryPath = directoryFrom(resourcePath);
  }

  if (directoryPath.indexOf(rootPath) !== 0) {
    throw new Error('WTF?');
  }

  const directory = RootDirectory + directoryPath.substring(rootPath.length);

  const config = Object.assign({}, configDefaults, { rootPath, directory  })
  return new I18n(config);
}

export * from '../../../../a-i18n-core-js/index.js';
