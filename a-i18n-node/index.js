
import { Ai18n } from '../a-i18n-core-js/index.js';
import { FS } from './src/fs.js';


export class I18n extends Ai18n {
  __initializeFS$ () {
    return FS;
  }
}

export * from '../a-i18n-core-js/index.js';
