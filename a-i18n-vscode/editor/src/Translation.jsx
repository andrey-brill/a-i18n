
import React, { useRef, useState } from 'react';

import { A, ActionLink, onAction } from './Actions.jsx';
import { IconApprove, IconCheckOff, IconComment, IconDiff } from './Icons.jsx';
import { diffWords } from './utils/Diff.js';
import { Space } from './Space.jsx';
import { Textarea } from './Textarea.jsx';
import { hasComment$, tCompare$ } from '../../../a-i18n-core-js/index.js';


const Topper = ({ children }) => (
  <div className='lt-topper'>
    <div className='lt-topper-black'></div>
    <div className='lt-topper-children'>{children}</div>
  </div>
)

const prepare = (value) => (value || '').replace(/\s/g, '⎵');

const DiffLine = ({ previous = '', current = '' }) => {

  let diffValue = undefined;
  if (previous !== current) {
    diffValue = diffWords(previous || '', current);
  }

  return <>
    {
      diffValue &&
      <div className='lt-line lt-diff'>
        <span><IconDiff /></span>
        <div>{diffValue.map((part, i) => <span key={i} className={part.added ? 'lt-added' : (part.removed ? 'lt-removed' : undefined)}>{prepare(part.value)}</span>)}</div>
      </div>
    }
  </>
}



export const Translation = ({ locale, current, previous, onChange }) => {

  const [t, setT] = useState(current); // ignoring incoming updates on change

  const [forceUpdate, setForceUpdate] = useState(1);

  const [showComment, setShowComment] = useState(hasComment$(current));

  const updater = useRef();
  if (!updater.current) {

    const single = Object.assign({ locale }, current);

    const updateT = (updates) => {

      Object.assign(single, updates);

      const copy = Object.assign({}, single);
      setT(copy)
      onChange(copy);
    };

    updater.current = {

      setValue: (v) => {
        updateT({
          value: v,
          approved: false
        });
      },

      setComment: (c) => {
        updateT({
          comment: c
        })
      },

      onAction: onAction((action) => {

        switch(action) {

          case A.approve:
            updateT({ approved: true });
            break;

          case A.disapprove:
            updateT({ approved: false });
            break;

          case A.addComment:
            setShowComment(true);
            break;

          case A.removeComment:

            setShowComment(false);

            if (single.comment && single.comment.length > 0) {
              updater.current.setComment('');
            }

            break;

          case A.revertUpdate:

            if (previous) {
              setForceUpdate(Math.round(Math.random() * 10000));
              updateT(previous);
              setShowComment(hasComment$(previous));
            }

            break;
        }
      })
    }
  }

  console.log('render t', JSON.stringify(t));

  const localeParts = locale.split('-');
  const disabledClass = localeParts.length === 1 ? 'lt-disabled' : undefined;

  const changed = previous && !tCompare$(t, previous);

  return <div className='g-translation'>
    <div className='lt-header'>
      <Topper>
        <div className='lt-locale'><span>{localeParts[0]}</span><span className={disabledClass}>-</span><span className={disabledClass}>{localeParts[1] || 'XX'}</span></div>
      </Topper>
      <div className='lt-grow'/>
      <Topper>
        <Space.div className='lt-actions' x={5} onClick={updater.current.onAction}>
            <ActionLink a={ t.approved ? A.disapprove : A.approve } />
            <ActionLink a={ showComment ? A.removeComment : A.addComment } />
            <ActionLink a={A.revertUpdate} disabled={!changed} />
        </Space.div>
      </Topper>
    </div>
    <div className='lt-content'>
      <div className='lt-line lt-value'>
        <span>{ t.approved ? <IconApprove/> : <IconCheckOff/> }</span>
        <Textarea key={'update-' + forceUpdate} initialValue={t.value} setValue={updater.current.setValue}/>
      </div>
      {
        previous &&
        <DiffLine previous={previous.value} current={t.value} />
      }
      {
        showComment &&
        <div className='lt-line lt-comment'>
          <span><IconComment /></span>
          <Textarea initialValue={t.comment} setValue={updater.current.setComment}/>
        </div>
      }
    </div>
  </div>;
};
