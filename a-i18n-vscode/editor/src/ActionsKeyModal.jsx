import React, { useRef, useState } from 'react';

import { simpleDebounce } from '../../../a-i18n-core-js/index.js';
import { Action } from '../../core/constants.js';
import { InputConnector } from './Input.jsx';
import { useMessage, VsCode } from './utils/VsCode.js';
import { ActionModal } from './ActionModals';


class ActionsKeyHandler extends InputConnector {

  constructor(action, key, setExists, onClose) {
    super();

    this.action = action;
    this.previousKey = key;
    this.key = key;
    this.onClose = onClose;

    this.setExists = (v) => {
      if (this.exists !== v) {
        this.exists = v;
        setExists(v);
      }
    };

    this.exists = true;
    this.debounceCheck = simpleDebounce(() => this.checkKey(), 300);

    if (this.action !== Action.CopyKey && this.action !== Action.RenameKey) {
      throw new Error('WTF?');
    }

    Object.assign(this.keyDown, { Enter: this.handleClick });
  }

  handleChange(key = '') {
    this.validation(key);
  }

  validation(key = this.key) {

    this.key = key;

    if (this.previousKey === key) {
      this.setExists(true);
    } else {
      this.debounceCheck();
    }

    return this.exists ? 'The key already exists' : null;
  }

  checkKey() {
    if (this.key !== this.requestedKey) {
      this.requestedKey = this.key;
      VsCode.post(Action.CheckKey, { key: this.requestedKey });
    }
  }

  onCheck(data = {}) {

    if (data.key !== this.key) {
      this.validation();
    } else {
      this.setExists(data.exists);
    }

  }

  handleClick = () => {
    if (!this.exists) {
      VsCode.post(this.action, { fromKey: this.previousKey, toKey: this.key });
      this.onClose();
    }
  };

}


export const ActionsKeyModal = ({ action, value, onClose }) => {

  const [exists, setExists] = useState(true);

  const connectorRef = useRef();
  if (!connectorRef.current) {
    connectorRef.current = new ActionsKeyHandler(action, value, setExists, onClose);
  }

  useMessage((action, data) => {
    if (action === Action.CheckKey) {
      connectorRef.current.onCheck(data);
    }
  });


  return (
    <ActionModal
      action={action}
      onClose={onClose}
      connector={connectorRef.current}
      value={value}
      showValidation={value !== connectorRef.current.key}
      validation={exists ? 'The key already exists' : null} />
  );
};