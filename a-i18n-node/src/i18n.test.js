
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { buildFK, DefaultI18n, DefaultLocale, endWithSlash, InvalidDirectoryError, safeValue, toBacklog } from '../../a-i18n-core-js/index.js';
import { I18n } from './i18n.js';


const mkDir = (dir) => existsSync(dir) ? null : mkdirSync(dir);
const rmDir = (dir) => rmSync(dir, { recursive: true, force: true });
const mkFile = (dir, file, content) => writeFileSync(endWithSlash(dir) + file, content);
const rdFile = (dir, file) => readFileSync(endWithSlash(dir) + file).toString().replace(/\r/g, '');

const root = './tests/';
mkDir(root);

let latestError = undefined;
const errorHandler = (e) => {
  latestError = e;
  throw e;
}


const key0 = 'test.key.zero';
const backEn0 = `-${key0}=\n`

const key1 = 'test.key.one';
const safeValue1 = ' My test.key.one key value ';

const key2 = 'test.key.two';
const value2 = ' My test.key.two key\n value';
const safeValue2 = safeValue(value2);

const comment2 = '\nMy test.key.two comment value ';
const safeComment2 = safeValue(comment2);

const fileEn12 = `-${key1}=\n/${key2}=${safeComment2}\n+${key2}=${safeValue2}\n-${key1}=${safeValue1}\n`;
const fileEn012 = `-${key1}=${safeValue1}\n/${key2}=${safeComment2}\n+${key2}=${safeValue2}\n`;



test(`a-i18n-node`, () => {

  const dir = 'load-i18n';
  const p = root + 'load-i18n';
  rmDir(p)

  const i18n = new I18n({
    rootPath: resolve(root),
    directory: './' + dir,
    errorHandler
  });

  return i18n.load()
    .catch(e => {
      expect(e).toBeInstanceOf(InvalidDirectoryError);
      expect(latestError).toBeInstanceOf(InvalidDirectoryError);
    })


    .then(() => {
      mkDir(p);
      return i18n.load();
    })
    .then(() => {
      expect(i18n.state.locales).toEqual([ DefaultLocale ]);
      expect(i18n.state.files[DefaultLocale].name).toEqual(DefaultI18n);
      expect(i18n.state.files[DefaultLocale].locale).toEqual(DefaultLocale);
    })

    .then(() => i18n.addKey({ key: key0 }))
    .then(() => {
      expect(rdFile(p, toBacklog(DefaultI18n))).toEqual(backEn0);
      expect(i18n.state.keys.has(key0)).toBe(true);
    })

    .then(() => i18n.save())
    .then(() => {
      expect(i18n.state.origins[buildFK(DefaultLocale, key0)]).toEqual({ approved: false, key: key0, value: '', type: '-' });
      expect(rdFile(p, DefaultI18n).trim()).toEqual('');
    })

    .then(() => i18n.addKey({ key: key1 }))
    .then(() => i18n.applyChange({ locale: DefaultLocale, key: key2, value: value2, comment: comment2, approved: true }))
    .then(() => i18n.applyChange({ locale: DefaultLocale, key: key1, value: safeValue1 }))
    .then(() => {
      expect(rdFile(p, toBacklog(DefaultI18n))).toEqual(fileEn12);
      expect(i18n.state.keys.has(key0)).toBe(true);
      expect(i18n.state.keys.has(key1)).toBe(true);
      expect(i18n.state.keys.has(key2)).toBe(true);

      expect(i18n.state.keys.array).toEqual([key1, key2, key0]);
    })

    .then(() => i18n.save())
    .then(() => {
      expect(rdFile(p, DefaultI18n)).toEqual(fileEn012);
    })
    ;
})