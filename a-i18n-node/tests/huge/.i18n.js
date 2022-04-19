import fs from 'fs';

export default {
  validate: (_exportOptions, _state) => {},
  open: (_exportOptions, _file) => {
    return {};
  },
  write: (openResult, { key, value }) => {

    const props = key.split('.');

    const lastProp = props.pop();

    let o = openResult;
    for (const prop of props) {
      const inner = o[prop];
      if (inner && typeof inner !== 'string') {
        o = inner;
      } else {
        o = o[prop] = {};
      }
    }

    o[lastProp] = value;
  },
  close: (openResult, file) => {
    fs.writeFileSync('./tests/export/' + file.name.replace('.i18n', '.json'), JSON.stringify(openResult));
  }
};