
import { Ai18n } from '../../a-i18n-core-js/index.js';
import { FS } from './fs.js';


export class I18n extends Ai18n {
  __initializeFS () {
    return FS;
  }
}