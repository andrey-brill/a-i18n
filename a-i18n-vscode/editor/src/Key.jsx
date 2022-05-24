import React from 'react';
import { A, ActionIcon } from './Actions.jsx';
import { Dropdown } from './Dropdown.jsx';
import { Space } from './Space.jsx';

export const Key = () => {
  return (
    <div className='g-key'>
      <div className='g-key-locale'>
        <label><span>l</span><span>o</span><span>c</span><span>a</span><span>l</span><span>e</span></label>
      </div>
      <div className='g-key-value'>
        <span>hello.world.key</span>
        <Space.div>
          <ActionIcon a={A.copyKey} />
          <ActionIcon a={A.renameKey} />
          <ActionIcon a={A.deleteKey} />
        </Space.div>
      </div>
      <div>
        <Dropdown title="Translations" right={true} as={[A.pinLocales]} />
      </div>
    </div>
  );
};
