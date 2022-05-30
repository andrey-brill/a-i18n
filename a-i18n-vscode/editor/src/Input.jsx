
import React, { useEffect, useRef, useState } from 'react';

import { ActionButton } from './Actions.jsx';


export const Input = ({ initialValue = '', placeholder, onChange, action, highlightAction = false, onClick, onKeyDown, focus = true }) => {

  const input = useRef();
  const [value, setValue] = useState(initialValue);

  const onInput = (e) => {
    setValue(e.target.value);
    onChange(e.target.value);
  };

  useEffect(() => {

    setTimeout(() => {
      if (input.current && focus) {
        input.current.focus();
      }
    }, 300);

  }, [focus]);

  return (
    <div className="g-input">
      <input ref={input} className="li-input" value={value} onChange={onInput} onKeyDown={onKeyDown} placeholder={placeholder} />
      <div className="li-separator" />
      <ActionButton onClick={onClick} action={action} highlighted={highlightAction}/>
    </div>
  );
};


export class InputConnector {

  onChange = (v) => {
    this.handleChange(v);
  };
  onClick = (e) => {
    this.handleClick(e);
  };
  onKeyDown = (e) => {
    this.handleKeyDown(e);
  };

  handleChange() {
  }

  handleClick() {
  }

  handleKeyDown() {
  }
}
