
import React from 'react';
import { boolCompare, strCompare } from '../../../a-i18n-core-js/index.js';

import { IconDiff } from './Icons.jsx';
import { diffWords } from './utils/Diff.js';


const safeDiff = (value) => (value || '').replace(/\s/g, '⎵');

export const unsafeDiff = (value) => (value || '').replace(/⎵/g, ' ');

export const TranslationDiff = ({ previous, current, previousApproved, currentApproved }) => {

  const sameApprove = boolCompare(previousApproved, currentApproved);

  let diffValue = [];
  if (!strCompare(previous, current) || !sameApprove) {
    diffValue = diffWords(previous || '', current || '');
  }


  const diff = !sameApprove || diffValue.length > 0;

  return <>
    {diff &&
      <div className='lt-line lt-diff'>
        <span className={sameApprove ? '' : ( currentApproved ? 'lt-added' : 'lt-removed' )}><IconDiff /></span>
        <div>{diffValue.map((part, i) => <span key={i} className={part.added ? 'lt-added' : (part.removed ? 'lt-removed' : undefined)}>{safeDiff(part.value)}</span>)}</div>
      </div>}
  </>;
};
