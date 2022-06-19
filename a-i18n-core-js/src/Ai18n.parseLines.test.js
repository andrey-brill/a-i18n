
import { parseLines } from './Ai18n.parseLines.js';
import { InvalidFormatError } from './Errors.js';

const nl = '\n', nr = '\r';

const line0K = '-empty=';
const line0V = { type: '-', approved: false, key: 'empty', value: '' };

const line1K = '- test.key=Text';
const line1V = { type: '-', approved: false, key: ' test.key', value: 'Text' };

const line2K = '+test.approve= Text approved ';
const line2V = { type: '+', approved: true, key: 'test.approve', value: ' Text approved ' };

const line3K = '/test.comment= Comment text ';
const line3V = { type: '/', key: 'test.comment', comment: ' Comment text ' };

const line4K = '#test.delete';
const line4V = { type: '#', key: 'test.delete' };

const line5K = '#test.delete ';
const line5V = { type: '#', key: 'test.delete ' };


const examples = {
  [line0K]: [line0V],
  [line1K]: [line1V],
  [line2K]: [line2V],
  [line3K]: [line3V],
  [line4K]: [line4V],
  [line5K]: [line5V],
  [nl + nl + line1K + nr + nl + nr + nl]: [line1V],
  [nr + nl + line1K + nl + nr + line2K + nr]: [line1V, line2V],
  [nr + nl + line1K + nl + nr + line2K + nl + line3K + nl + line4K]: [line1V, line2V, line3V, line4V]
}

for (const example of Object.keys(examples)) {
  test(`a-i18n-core-js.parseLines(): ${example}`, () => {
    expect(parseLines(example)).toEqual(examples[example]);
  })
}


const incorrect = [ '+incorrect', '-incorrect' + nl, nr + '/incorrect' + nr ];

for (const example of incorrect) {
  test(`a-i18n-core-js.parseLines(): ${example}`, () => {
    expect(() => parseLines(example)).toThrow(InvalidFormatError);
  })
}