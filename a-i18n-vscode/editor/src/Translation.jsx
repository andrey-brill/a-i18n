
import React from 'react';

import { A, ActionLink } from './Actions.jsx';
import { IconApprove, IconCheckOff, IconComment, IconDiff } from './Icons.jsx';
import { diffWords } from './utils/Diff.js';
import { Space } from './Space.jsx';


const Topper = ({ children }) => (
  <div className='lt-topper'>
    <div className='lt-topper-black'></div>
    <div className='lt-topper-children'>{children}</div>
  </div>
)

export const Translation = ({ locale, approved = false, value, comment, previousValue, onChange }) => {

  // TODO safe + unsafe value
  // auto disapprove on change value

  const localeParts = locale.split('-');
  const disabledClass = localeParts.length === 1 ? 'lt-disabled' : undefined;

  let diff = undefined;
  if (previousValue) {
    diff = diffWords(previousValue, value || '');
  }

  return <div className='g-translation'>
    <div className='lt-header'>
      <Topper>
        <div className='lt-locale'><span>{localeParts[0]}</span><span className={disabledClass}>-</span><span className={disabledClass}>{localeParts[1] || 'XX'}</span></div>
      </Topper>
      <div className='lt-grow'/>
      <Topper>
        <Space.div className='lt-actions' x={5}>
            <ActionLink a={ approved ? A.disapprove : A.approve } />
            <ActionLink a={A.addComment} />
            <ActionLink a={A.revertUpdate} />
        </Space.div>
      </Topper>
    </div>
    <div className='lt-content'>
      <div className='lt-line lt-value'>
        <span>{ approved ? <IconApprove/> : <IconCheckOff/> }</span>
        <div>{value}</div>
      </div>
      {
        diff &&
        <div className='lt-line lt-diff'>
          <span><IconDiff /></span>
          <div>{diff.map((part, i) => <span key={i} className={part.added ? 'lt-added' : (part.removed ? 'lt-removed' : undefined)}>{part.value}</span>)}</div>
        </div>
      }
      {
        comment &&
        <div className='lt-line lt-comment'>
          <span><IconComment /></span>
          <div>{comment}</div>
        </div>
      }
    </div>
  </div>;
};
