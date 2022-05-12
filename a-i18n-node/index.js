import { Ai18n } from '../index.js';
import { FS } from './@src/fs.js';


export * from '../index.js';
export class I18n extends Ai18n {
  __initializeFS$ () {
    return FS;
  }
}

// console.time('fileContent')

// const i18n = new I18n({
//   directory: './@texts/huge'
// });

// i18n.load()
//   .then(() => i18n.deleteKey({ key: 'new-update-key' }))
//   .then(() => i18n.addKey({ key: 'new-update-key' }))
//   //.then(() => i18n.export())
//   .then(() => console.timeEnd('fileContent'));

// console.time('fileContent');

// const i18n = new I18n({
//   directory: './@texts/huge'
// });

// i18n.load().then(() => console.timeEnd('fileContent'));

// i18n._catchPromise(i18n._findI18nFiles().then(console.log));

// const fs = new FileSystem(FS);

// FileSystemAPI.existFile(FileSystemAPI.rootPath$() + '/as').then(console.log)

// import fs from 'fs';

// fs.stat('./').isFile()

// let line, lines;
// const path = './tests/huge/en.i18n';


// console.time('fileContent');
// const fileContent = fs.readFileSync(path).toString();
// console.timeEnd('fileContent');

// console.time('split');
// console.log('lines', fileContent.split('\n').length);
// console.timeEnd('split');

// console.time('split2');
// lines = [];
// let startIndex = 0;
// let j = 0;
// for (let i = 0; i < fileContent.length; i++) {

//   if (fileContent[i] === '\r') {
//     j++;
//   }
//   if (fileContent[i] === '\n') {
//     lines.push(fileContent.substring(startIndex, i));
//     startIndex = i + 1;
//   }

// }
// console.log('lines', lines.length, j);
// console.timeEnd('split2');

// async function read() {
//   const reader = new LineReader(path);

//   lines = [];
//   console.time('lineReader');
//   while (line = reader.next()) {
//     lines.push(line);
//   }

//   console.log('lines', lines.length);
//   console.timeEnd('lineReader');
// }

// setTimeout(() => {
//   read();
// }, 3000);

// const content = "this.test = 'hello world!';";

// const context = {
//   fn: function () {
//     this.test = 'a';
//     eval(content);
//   }
// }

// context.fn();

// console.log('fn', context.test);

