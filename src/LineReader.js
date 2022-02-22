
import fs from 'fs';

const Encoding = 'utf-8';
const ReadChunk = 1024;
const NewLineCode = '\n'.charCodeAt(0);


export default class LineReader {

  constructor(file) {

    this.fd = typeof file === 'number' ? file : fs.openSync(file, 'r');

    this.eofReached = false;
    this.linesCache = [];
    this.fdPosition = 0;
    this.li = 0;
  }

  close() {
    if (this.fd) {
      fs.closeSync(this.fd);
      this.fd = null;
    }
  }

  _extractLines(buffer) {

    let line;
    const lines = [];
    let bufferPosition = 0;

    let lastNewLineBufferPosition = 0;
    while (true) {
      let bufferPositionValue = buffer[bufferPosition++];

      if (bufferPositionValue === NewLineCode) {
        line = buffer.slice(lastNewLineBufferPosition, bufferPosition);
        lines.push(line);
        lastNewLineBufferPosition = bufferPosition;
      } else if (bufferPositionValue === undefined) {
        break;
      }
    }

    let leftovers = buffer.slice(lastNewLineBufferPosition, bufferPosition);
    if (leftovers.length) {
      lines.push(leftovers);
    }

    return lines;
  };

  _readChunk(lineLeftovers) {

    let totalBytesRead = 0;

    let bytesRead;
    const buffers = [];
    do {
      const readBuffer = new Buffer.alloc(ReadChunk);

      bytesRead = fs.readSync(this.fd, readBuffer, 0, ReadChunk, this.fdPosition);
      totalBytesRead = totalBytesRead + bytesRead;

      this.fdPosition = this.fdPosition + bytesRead;

      buffers.push(readBuffer);
    } while (bytesRead && buffers[buffers.length - 1].indexOf(NewLineCode) === -1);

    let bufferData = Buffer.concat(buffers);

    if (bytesRead < ReadChunk) {
      this.eofReached = true;
      bufferData = bufferData.slice(0, totalBytesRead);
    }

    if (totalBytesRead) {
      this.linesCache = this._extractLines(bufferData);

      if (lineLeftovers) {
        this.linesCache[0] = Buffer.concat([lineLeftovers, this.linesCache[0]]);
      }
    }

    return totalBytesRead;
  }

  next() {

    if (!this.fd) {
      return false;
    }

    if (this.eofReached && this.linesCache.length === 0) {
      return false;
    }

    let bytesRead;

    if (!this.linesCache.length) {
      bytesRead = this._readChunk();
    }

    let line = false;

    if (this.linesCache.length) {
      line = this.linesCache.shift();

      const lastLineCharacter = line[line.length - 1];

      if (lastLineCharacter !== NewLineCode) {
        bytesRead = this._readChunk(line);

        if (bytesRead) {
          line = this.linesCache.shift();
        }
      }
    }

    if (this.eofReached && this.linesCache.length === 0) {
      this.close();
    }

    if (line !== false) {
      line = line.toString(Encoding).trim();
    }

    return line;
  }
}
