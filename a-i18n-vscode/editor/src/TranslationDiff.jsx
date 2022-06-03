
import React from 'react';

import { IconDiff } from './Icons.jsx';
import { diffWords } from './utils/Diff.js';


const safeDiff = (value) => (value || '').replace(/\s/g, '⎵');

export const unsafeDiff = (value) => (value || '').replace(/⎵/g, ' ');

export const TranslationDiff = ({ previous = '', current = '' }) => {

  let diffValue = undefined;
  if (previous !== current) {
    diffValue = diffWords(previous || '', current);
  }

  return <>
    {diffValue &&
      <div className='lt-line lt-diff'>
        <span><IconDiff /></span>
        <div>{diffValue.map((part, i) => <span key={i} className={part.added ? 'lt-added' : (part.removed ? 'lt-removed' : undefined)}>{safeDiff(part.value)}</span>)}</div>
      </div>}
  </>;
};
