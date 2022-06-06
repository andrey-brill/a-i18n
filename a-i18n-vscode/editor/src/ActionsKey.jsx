import React, { useState } from 'react';

import { KeyState } from '../../../a-i18n-core-js/index.js';
import { Action } from '../../core/constants.js';
import { ActionIcon, onAction } from './Actions.jsx';
import { ActionsKeyModal } from "./ActionsKeyModal";
import { Space } from './utils/Space.jsx';
import { VsCode } from './utils/VsCode.js';




export const ActionsKey = ({ value, state = KeyState.Original }) => {

  const [showAction, setShowAction] = useState(null);

  const onClick = onAction(action => {

    switch (action) {

      case Action.CopyKey:
      case Action.RenameKey:
        return setShowAction(action);

      case Action.DeleteKey:
        return VsCode.post(Action.DeleteKey, { key: value });
      case Action.RevertChanges:
        return VsCode.post(Action.RevertChanges, { key: value });
      default:
        throw new Error("Unknown action key");
    }
  });

  const deleted = state === KeyState.Deleted || state === KeyState.Missing;

  return (
    <>
      <Space.div className="g-actions-key" onClick={onClick}>
        {state !== KeyState.Original && state !== KeyState.Missing && <ActionIcon action={Action.RevertChanges}/>}
        {!deleted && <ActionIcon action={Action.CopyKey} />}
        {!deleted && <ActionIcon action={Action.RenameKey} />}
        {!deleted && <ActionIcon action={Action.DeleteKey} />}
      </Space.div>
      { showAction && <ActionsKeyModal value={value} action={showAction} onClose={() => setShowAction(null)}/> }
    </>
  );
};
