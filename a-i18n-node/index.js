import { Ai18n } from '../index.js';
import { FS } from './@src/fs.js';


export * from '../index.js';
export class I18n extends Ai18n {
  __initializeFS$ () {
    return FS;
  }
}
