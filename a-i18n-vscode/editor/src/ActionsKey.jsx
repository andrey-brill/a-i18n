import React, { useState } from 'react';

import { Action } from '../../core/constants.js';
import { ActionIcon, ActionModal, onAction } from './Actions.jsx';
import { Space } from './utils/Space.jsx';
import { VsCode } from './utils/VsCode.js';




export const ActionsKey = ({ value }) => {

  const [showAction, setShowAction] = useState(null);

  const onClick = onAction(action => {
    console.log('run', action, value);

    switch (action) {

      case Action.CopyKey:
      case Action.RenameKey:
        return setShowAction(action);

      case Action.DeleteKey:
        return VsCode.post(Action.DeleteKey, { key: value });
      default:
        throw new Error("Unknown action key");
    }
  });

  return (
    <>
      <Space.div className="g-actions-key" onClick={onClick}>
        <ActionIcon action={Action.CopyKey} />
        <ActionIcon action={Action.RenameKey} />
        <ActionIcon action={Action.DeleteKey} />
      </Space.div>
      { showAction && <ActionModal value={value} action={showAction} onClose={() => setShowAction(null)}/> }
    </>
  );
};
