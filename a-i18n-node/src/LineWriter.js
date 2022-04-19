
import fs from 'fs';
import os from 'os';


export default class LineWriter {

  constructor(path) {
    this.fd = fs.openSync(path, 'w');
  }

  next(line) {
    fs.writeSync(this.fd, line + os.EOL);
  }

  close() {
    fs.closeSync(this.fd);
  }
}
