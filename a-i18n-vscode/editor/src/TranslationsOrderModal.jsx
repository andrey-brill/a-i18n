import React, { useRef, useState } from 'react';

import { useContextState } from './State.jsx';
import { Action, Preferences } from '../../core/constants.js';
import { InputConnector } from './Input.jsx';
import { VsCode } from './utils/VsCode.js';
import { ActionModal } from './ActionModals';
import { isValidLocalesOrder } from './utils/LocalesOrder.js';
import { CheckBox } from './CheckBox.jsx';


class TranslationsOrderHandler extends InputConnector {

  constructor(value, global, setValid, onClose) {
    super();

    this.global = global;
    this.value = value;
    this.isValid = isValidLocalesOrder(this.value);
    this.onClose = onClose;

    this.handleChange = (value) => {

      this.value = value;

      const isValid = isValidLocalesOrder(this.value);
      if (this.isValid !== isValid) {
        this.isValid = isValid;
        setValid(isValid);
      }
    };

    Object.assign(this.keyDown, { Enter: this.handleClick });
  }

  handleClick = () => {
    if (this.isValid) {
      VsCode.post(Action.Preference, { key: Preferences.LocalesOrder, value: this.value, global: this.global });
      this.onClose();
    }
  };

}


export const TranslationsOrderModal = ({ onClose }) => {

  const { preferences } = useContextState();

  const [isValid, setValid] = useState(true);
  const [global, setGlobal] = useState(false);

  const value = preferences[Preferences.LocalesOrder];

  const connectorRef = useRef();
  if (!connectorRef.current) {
    connectorRef.current = new TranslationsOrderHandler(value, global, setValid, onClose);
  }

  connectorRef.current.global = global;

  return (
    <ActionModal
      action={Action.LocalesOrder}
      onClose={onClose}
      connector={connectorRef.current}
      value={value}
      validation={isValid ? `Invalid line format. Use spaces as separators and locales in 'xx' or 'xx-XX' formats` : null}>
        <CheckBox action={Action.UpdateGlobalPreference} value={global} setValue={setGlobal}/>
    </ActionModal>
  );
};