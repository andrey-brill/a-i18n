
import React, { useRef, useState } from 'react';

import { ActionLink, onAction } from './Actions.jsx';
import { IconApprove, IconCheckOff, IconComment } from './Icons.jsx';
import { Space } from './utils/Space.jsx';
import { Textarea } from './Textarea.jsx';
import { EmptyT, hasComment, tCompare } from '../../../a-i18n-core-js/index.js';
import { Action } from '../../core/constants.js';
import { TranslationDiff } from './TranslationDiff';
import { VsCode } from './utils/VsCode.js';


const Topper = ({ children }) => (
  <div className='lt-topper'>
    <div className='lt-topper-black'></div>
    <div className='lt-topper-children'>{children}</div>
  </div>
)

class CurrentT {

  constructor(t, setT) {

    this.t = t;

    this.update = (changes) => {
      Object.assign(this.t, changes);
      setT(this.t);
      VsCode.post(Action.ApplyChange, { translation: this.t });
    }
  }

  setValue = (v) => {
    this.update({ value: v, approved: false });
  }

  setComment = (c) => {
    this.update({ comment: c });
  }

  onAction = (action) => {

    switch(action) {

      case Action.Approve:
        this.update({ approved: true });
        break;

      case Action.Disapprove:
        this.update({ approved: false });
        break;

      case Action.RemoveComment:
        this.setComment('');
        break;

      case Action.RevertChanges:
        VsCode.post(Action.RevertChanges, { locale: this.t.locale, key: this.t.key });
        break;
    }
  }
}


export const Translation = ({ selectedKey, locale, deleted, current, previous }) => {

  const [t, setT] = useState(Object.assign({ locale, key: selectedKey }, EmptyT, current)); // ignoring incoming changes on global state change

  const [showComment, setShowComment] = useState(hasComment(current));

  const updater = useRef();
  if (!updater.current) {
    updater.current = new CurrentT(t, setT);
  }

  const onClick = onAction((action) => {

    updater.current.onAction(action);

    switch(action) {

      case Action.AddComment:
        setShowComment(true);
        break;

      case Action.RemoveComment:
        setShowComment(false);
        break;
    }
  });

  const localeParts = locale.split('-');
  const disabledClass = localeParts.length === 1 ? 'lt-disabled' : undefined;

  const changed = deleted || (previous && !tCompare(t, previous));

  return <div className='g-translation'>
    <div className='lt-header'>
      <Topper>
        <div className='lt-locale'><span>{localeParts[0]}</span><span className={disabledClass}>-</span><span className={disabledClass}>{localeParts[1] || 'XX'}</span></div>
      </Topper>
      <div className='lt-grow'/>
      <Topper>
        <Space.div className='lt-actions' x={5} onClick={onClick}>
            { !deleted && <ActionLink action={ t.approved ? Action.Disapprove : Action.Approve } /> }
            { !deleted && <ActionLink action={ showComment ? Action.RemoveComment : Action.AddComment } /> }
            <ActionLink action={Action.RevertChanges} disabled={!changed} />
        </Space.div>
      </Topper>
    </div>
    <div className='lt-content'>
      {
        !deleted &&
        <div className='lt-line lt-value'>
          <span>{ t.approved ? <IconApprove/> : <IconCheckOff/> }</span>
          <Textarea initialValue={t.value} setValue={updater.current.setValue}/>
        </div>
      }
      {
        previous &&
        <TranslationDiff previous={previous.value} current={t.value} />
      }
      {
        !deleted && showComment &&
        <div className='lt-line lt-comment'>
          <span><IconComment /></span>
          <Textarea initialValue={t.comment} setValue={updater.current.setComment}/>
        </div>
      }
    </div>
  </div>;
};
