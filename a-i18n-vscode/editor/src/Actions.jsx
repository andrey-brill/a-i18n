
import React, { useRef, useState } from 'react';

import { simpleDebounce$ } from '../../../a-i18n-core-js/index.js';
import { Action } from '../../core/constants.js';
import { getActionInfo } from './getActionInfo.jsx';
import { Input, InputConnector } from './Input.jsx';
import { Overlay } from './utils/Overlay.jsx';
import { useOnClickOutside } from './utils/useOnClickOutside.js';
import { useMessage, VsCode } from './utils/VsCode.js';


export const ActionButton = ({ action, className = '', disabled, highlighted = false, onClick }) => {
  const a = getActionInfo(action);
  return <button id={disabled ? undefined : action} disabled={disabled} className={`g-action ${ highlighted ? 'la-highlighted' : '' } ${ disabled ? 'la-disabled' : '' } ${className}`} onClick={onClick} title={a.details}>{a.icon}<span>{a.title}</span></button>;
}

export const ActionLink = ({ action, className = '', disabled = false, onClick, showTitle=true }) => {
  const a = getActionInfo(action);
  return <a id={disabled ? undefined : action} href='' className={'g-action ' + (disabled ? 'la-disabled' : '') + ' ' + className} onClick={onClick} title={a.details}>{a.icon}{showTitle ? <span>{a.title}</span> : undefined}</a>;
}

export const ActionIcon = ({ action, className, disabled }) => <ActionLink action={action} disabled={disabled} className={className} showTitle={false}/>

export const onAction = (onClick) => (e) => {

  e.preventDefault();

  const action = e.target.id || e.currentTarget.id || e.target && e.target.parentElement && e.target.parentElement.id;
  if (action) onClick(action);
}


class ActionHandler extends InputConnector {

  constructor(key, rerender) {
    super();
    this.key = key;
    this.rerender = rerender;

    this.exists = true;
    this.debounceCheck = simpleDebounce$(() => this.checkKey(), 300);
  }

  handleChange(key) {
    this.resolveExists(this.previousKey, key);
  }

  resolveExists(previousKey, key) {

    this.key = key;
    this.previousKey = previousKey;

    if (this.previousKey === key) {
      this.exists = true;
    } else {
      this.debounceCheck();
    }

    return this.exists;
  }

  checkKey() {
    if (this.key !== this.requestedKey) {
      this.requestedKey = this.key;
      VsCode.post(Action.CheckKey, { key: this.requestedKey });
    }
  }

  onCheck(data = {}) {

    if (data.key !== this.key) {
      this.resolveExists(this.previousKey, this.key);
    } else {
      this.exists = data.exists;
    }

    this.rerender();
  }


}


export const ActionModal = ({ action, value, onClose }) => {

  const a = getActionInfo(action);
  const ref = useOnClickOutside({ onTriggered: onClose });

  const [_, rerender] = useState();

  const connectorRef = useRef();
  if (!connectorRef.current) {
    connectorRef.current = new ActionHandler(value, () => rerender(Math.random())); // disable on same, check is exists
  }

  useMessage((action, data) => {
    if (action === Action.CheckKey) {
      connectorRef.current.onCheck(data);
    }
  });

  const key = connectorRef.current.key;
  const exists = connectorRef.current.resolveExists(value, key);

  return (
    <Overlay>
      <div ref={ref} className='g-action-modal'>
        <div className='lam-title'>{a.details}</div>
        <div className='lam-previous'><span>Current:</span>{value}</div>
        <div className='lam-input'>
          <Input initialValue={value} action={action} connector={connectorRef.current} actionDisabled={exists}/>
          { exists && value !== key && <span className='lam-exists'>The key already exists</span> }
        </div>
      </div>
    </Overlay>
  );
}