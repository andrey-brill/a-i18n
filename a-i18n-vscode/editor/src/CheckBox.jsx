
import React from 'react';

import { getActionInfo } from './utils/getActionInfo.jsx';
import { IconCheckOff, IconCheckOn } from './Icons.jsx';


export const CheckBox = ({ className = '', action, value = false, setValue }) => {

  const info = getActionInfo(action);

  return (
    <div className={`g-check-box ${className}`} onClick={(e) => { e.preventDefault(); setValue(!value) }} title={info.details}>
      { value ? <IconCheckOn/> : <IconCheckOff/> }
      <span>{info.title}</span>
    </div>
  );
};
