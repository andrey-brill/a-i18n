
import React from 'react';

import { A, ActionLink } from './Actions.jsx';
import { IconApprove, IconCheckOff, IconComment, IconDiff } from './Icons.jsx';
import { diffWords } from './utils/Diff.js';
import { Space } from './Space.jsx';


const Topper = ({ children }) => (
  <div className='g-topper'>
    <div className='g-topper-black'></div>
    <div className='g-topper-children'>{children}</div>
  </div>
)

export const Translation = ({ locale, approved = false, value, comment, previousValue, onChange }) => {

  // TODO safe + unsafe value
  // auto disapprove on change value

  const localeParts = locale.split('-');
  const disabledClass = localeParts.length === 1 ? 'disabled' : undefined;

  let diff = undefined;
  if (previousValue) {
    diff = diffWords(previousValue, value || '');
  }

  return <div className='g-translation'>
    <div className='g-translation-header'>
      <Topper>
        <div className='locale'><span>{localeParts[0]}</span><span className={disabledClass}>-</span><span className={disabledClass}>{localeParts[1] || 'XX'}</span></div>
      </Topper>
      <div className='grow'/>
      <Topper>
        <Space.div className='actions' x={5}>
            <ActionLink a={ approved ? A.disapprove : A.approve } />
            <ActionLink a={A.addComment} />
            <ActionLink a={A.revertUpdate} />
        </Space.div>
      </Topper>
    </div>
    <div className='content'>
      <div className='line value'>
        <span>{ approved ? <IconApprove/> : <IconCheckOff/> }</span>
        <div>{value}</div>
      </div>
      {
        diff &&
        <div className='line diff'>
          <span><IconDiff /></span>
          <div>{diff.map((part, i) => <span key={i} className={part.added ? 'added' : (part.removed ? 'removed' : undefined)}>{part.value}</span>)}</div>
        </div>
      }
      {
        comment &&
        <div className='line comment'>
          <span><IconComment /></span>
          <div>{comment}</div>
        </div>
      }
    </div>
  </div>;
};
