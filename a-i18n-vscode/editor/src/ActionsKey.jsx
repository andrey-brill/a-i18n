import React from 'react';

import { A, ActionIcon, onAction } from './Actions.jsx';
import { Space } from './Space.jsx';


export const ActionsKey = ({ value }) => {

  const onClick = onAction((action) => {
    console.log('run', action, value);
  });

  return (
    <Space.div className="g-actions-key" onClick={onClick}>
      <ActionIcon a={A.copyKey} />
      <ActionIcon a={A.renameKey} />
      <ActionIcon a={A.deleteKey} />
    </Space.div>
  );
};
