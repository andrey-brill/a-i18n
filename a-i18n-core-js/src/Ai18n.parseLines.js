
import { CommentLine, ApprovedLine, DeleteLine } from './Constants.js';
import { InvalidFormatError } from './Errors.js';


export function parseLines(content = '') {

  if (content.length === 0) { // don't use trim(), as it removes trailing space from text
    return [];
  }

  const lines = [];

  let isKey = true;
  let startIndex = 0;
  let type = '';
  let key = '';

  for (let i = 0; i <= content.length; i++) {

    let current = content[i];

    if (isKey) {
      if (startIndex === i) {
        if (current === '\n' || content[i] === '\r') { // ignore \n after \r and empty lines
          startIndex++;
        } else {
          type = current;
        }
      } else {

        if (type === DeleteLine && (current === '\r' || current === '\n' || current === undefined)) {
          key = content.substring(startIndex + 1, i);
          startIndex = i + 1;
          lines.push({ type, key });
        } else if (current === '=') {
          key = content.substring(startIndex + 1, i);
          startIndex = i + 1;
          isKey = false;
        }
      }

    } else {
      if (current === '\r' || current === '\n' || current === undefined) {

        const value = content.substring(startIndex, i);

        if (type === CommentLine) {
          lines.push({
            type,
            key,
            comment: value
          });
        } else {
          lines.push({
            type,
            key,
            value,
            approved: type === ApprovedLine
          });
        }

        isKey = true;
        startIndex = i + 1;
      }

    }

  }

  if (startIndex < content.length) {
    throw new InvalidFormatError(content.substring(startIndex));
  }

  return lines;
}
