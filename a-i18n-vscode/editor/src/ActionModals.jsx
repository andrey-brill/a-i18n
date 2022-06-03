import React from 'react';

import { getActionInfo } from './utils/getActionInfo.jsx';
import { Input } from './Input.jsx';
import { Overlay } from './utils/Overlay.jsx';
import { useOnClickOutside } from './utils/useOnClickOutside.js';


export const ActionModal = ({ action, onClose, connector, value, validation, showValidation = true, children }) => {

  const actionInfo = getActionInfo(action);
  const ref = useOnClickOutside({ onTriggered: onClose });

  return (
    <Overlay>
      <div ref={ref} className='g-action-modal'>
        <div className='lam-title'>{actionInfo.details}</div>
        <div className='lam-current'><span>Current:</span>{value}</div>
        <Input initialValue={value} action={action} connector={connector} actionDisabled={!!validation} />
        {showValidation && validation && <span className='lam-error'>{validation}</span>}
        {children}
      </div>
    </Overlay>
  );
};


