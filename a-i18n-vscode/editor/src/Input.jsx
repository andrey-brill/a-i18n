
import React, { useEffect, useRef, useState } from 'react';

import { strIsEmpty } from '../../../a-i18n-core-js/index.js';
import { ActionButton } from './Actions.jsx';


export const Input = ({ initialValue = '', placeholder, action, actionHighlighted = false, actionDisabled = false, connector, focus = true, resetOnEscape = false }) => {

  const input = useRef();
  const [value, setValue] = useState(initialValue);

  const onInput = (e) => {
    setValue(e.target.value);
    connector.onChange(e.target.value);
  };

  const onKeyDown = (e) => {

    if (e.key === 'Escape' && resetOnEscape && value && value.length > 0) {
      e.preventDefault();
      setValue('');
      connector.onChange('');
    } else if (connector.onKeyDown) {
      connector.onKeyDown(e);
    }
  }

  useEffect(() => {

    setTimeout(() => {
      if (input.current && focus) {
        input.current.focus();
        input.current.select();
      }
    }, 300);

  }, [focus]);

  const disabled = actionDisabled || strIsEmpty(value);

  return (
    <div className="g-input">
      <input ref={input} className="li-input" value={value} onChange={onInput} onKeyDown={onKeyDown} placeholder={placeholder} onFocus={() => connector.onFocus(true)} onBlur={() => connector.onFocus(false)} />
      <div className="li-separator" />
      <ActionButton className="li-button" onClick={connector.onClick} action={action} highlighted={!disabled && actionHighlighted} disabled={disabled}/>
    </div>
  );
};


export class InputConnector {

  constructor() {
    this.keyDown = {};
  }

  onChange = (v) => {
    this.handleChange(v);
  };

  onClick = (e) => {
    this.handleClick(e);
  };

  onKeyDown = (e) => {
    this.handleKeyDown(e);
  };

  onFocus = (v) => {
    this.handleFocus(v);
  };

  handleChange() {
  }

  handleClick() {
  }

  handleKeyDown(e) {
    const handler = this.keyDown[e.key];
    if (handler) {
      e.preventDefault();
      handler(e);
    }
  }

  handleFocus() {

  }
}
