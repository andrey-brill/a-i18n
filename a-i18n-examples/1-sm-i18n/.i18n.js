
const { type, config, fs } = this;

const path = './dist/' + config.directory.replace('./', '');

const files = {}

Object.assign(this, {

  validate: (state) => {
    return !!state;
  },

  begin: (file) => {
    const fileData = files[file.name] = {};
    return fileData;
  },

  insert: (fileData, { key, value }) => {

    const props = key.split('.');

    const lastProp = props.pop();

    let o = fileData;
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

  end: (file) => {
    files[file.name] = JSON.stringify(files[file.name]);
  },

  save: () => {
    return fs.createPath(path)
      .then(() => Promise.all(
        Object.keys(files)
          .map(fileName => fs.writeFile(path + fileName.replace('.i18n', '.json'), files[fileName]))
      ))
      .then(() => {
        return 'Exported files: ' + Object.keys(files).join(', ') + '.';
      });
  }
});