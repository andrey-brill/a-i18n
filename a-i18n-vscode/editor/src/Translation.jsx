
import React, { useRef, useState } from 'react';

import { ActionLink, onAction } from './Actions.jsx';
import { IconApprove, IconCheckOff, IconComment } from './Icons.jsx';
import { Space } from './utils/Space.jsx';
import { Textarea } from './Textarea.jsx';
import { hasComment, tCompare } from '../../../a-i18n-core-js/index.js';
import { Action } from '../../core/constants.js';
import { TranslationDiff } from './TranslationDiff';


const Topper = ({ children }) => (
  <div className='lt-topper'>
    <div className='lt-topper-black'></div>
    <div className='lt-topper-children'>{children}</div>
  </div>
)


export const Translation = ({ locale, current, previous, onChange }) => {

  if (!current) {
    throw new Error(`Can't render translation without current state`);
  }

  const [t, setT] = useState(current); // ignoring incoming changes on change

  const [forceUpdate, setForceUpdate] = useState(1);

  const [showComment, setShowComment] = useState(hasComment(current));

  const updater = useRef();
  if (!updater.current) {

    const single = Object.assign({ locale }, current);

    const updateT = (changes) => {

      Object.assign(single, changes);

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

          case Action.Approve:
            updateT({ approved: true });
            break;

          case Action.Disapprove:
            updateT({ approved: false });
            break;

          case Action.AddComment:
            setShowComment(true);
            break;

          case Action.RemoveComment:

            setShowComment(false);

            if (single.comment && single.comment.length > 0) {
              updater.current.setComment('');
            }

            break;

          case Action.RevertChange:

            if (previous) {
              setForceUpdate(Math.round(Math.random() * 10000));
              updateT(previous);
              setShowComment(hasComment(previous));
            }

            break;
        }
      })
    }
  }

  const localeParts = locale.split('-');
  const disabledClass = localeParts.length === 1 ? 'lt-disabled' : undefined;

  const changed = previous && !tCompare(t, previous);

  return <div className='g-translation'>
    <div className='lt-header'>
      <Topper>
        <div className='lt-locale'><span>{localeParts[0]}</span><span className={disabledClass}>-</span><span className={disabledClass}>{localeParts[1] || 'XX'}</span></div>
      </Topper>
      <div className='lt-grow'/>
      <Topper>
        <Space.div className='lt-actions' x={5} onClick={updater.current.onAction}>
            <ActionLink action={ t.approved ? Action.Disapprove : Action.Approve } />
            <ActionLink action={ showComment ? Action.RemoveComment : Action.AddComment } />
            <ActionLink action={Action.RevertChange} disabled={!changed} />
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
        <TranslationDiff previous={previous.value} current={t.value} />
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
