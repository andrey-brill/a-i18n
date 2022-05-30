
import React from 'react';

import { ActionLink, onAction } from './Actions.jsx';
import { IconMenu } from './Icons.jsx';
import { Space } from './Space.jsx';


export const Dropdown = ({ title, actions = [], right = false, onClick }) => (
  <div className='g-dropdown'>
    <Space.div>
      <span className='ld-title'>{title}</span>
      <IconMenu/>
    </Space.div>
    <div className="ld-content" style={right ? { right: 0 } : {}} onClick={onAction(onClick)}>
      {actions.map(action => <ActionLink key={action} action={action} />)}
    </div>
  </div>
);
