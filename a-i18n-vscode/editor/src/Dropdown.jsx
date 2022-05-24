
import React from 'react';

import { ActionLink } from './Actions.jsx';
import { IconMenu } from './Icons.jsx';
import { Space } from './Space.jsx';


export const Dropdown = ({ title, as = [], right = false, onClick }) => {
  return <div className='g-dropdown'>
    <Space.div>
      <span className='g-dropdown-title'>{title}</span>
      <IconMenu/>
    </Space.div>
    <div className="g-dropdown-content" style={right ? { right: 0 } : {}}>
      {as.map(a => <ActionLink key={a} a={a} onClick={onClick} />)}
    </div>
  </div>;
};
