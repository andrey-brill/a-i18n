import React from 'react';

import { Action } from '../../core/constants.js';
import { ActionIcon, onAction } from './Actions.jsx';
import { Space } from './Space.jsx';


export const ActionsKey = ({ value }) => {

  const onClick = onAction((action) => {
    console.log('run', action, value);
  });

  return (
    <Space.div className="g-actions-key" onClick={onClick}>
      <ActionIcon action={Action.CopyKey} />
      <ActionIcon action={Action.RenameKey} />
      <ActionIcon action={Action.DeleteKey} />
    </Space.div>
  );
};
