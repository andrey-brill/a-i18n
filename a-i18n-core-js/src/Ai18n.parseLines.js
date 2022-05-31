import { CommentLine, ApprovedLine } from './Constants.js';

export function parseLines(content = '') {

  content = content.trim();
  if (content.length === 0) {
    return [];
  }

  const lines = [];

  let isKey = true;
  let startIndex = 0;
  let type = '';
  let key = '';

  for (let i = 0; i < content.length; i++) {

    let current = content[i];

    if (isKey) {
      if (startIndex === i) {
        if (current === '\n' || content[i] === '\r') { // ignore \n after \r and empty lines
          startIndex++;
        } else {
          type = current;
        }
      } else {
        if (current === '=') {

          key = content.substring(startIndex + 1, i);
          startIndex = i + 1;
          isKey = false;

          if (content.length - 1 === i) {
            if (type === CommentLine) {
              lines.push({
                type,
                key,
                comment: ''
              });
            } else {
              lines.push({
                type,
                key,
                value: '',
                approved: type === ApprovedLine
              });
            }
          }
        }
      }

    } else {
      if (content[i] === '\r' || content[i] === '\n' || (content.length - 1 === i)) {

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

  return lines;
}
