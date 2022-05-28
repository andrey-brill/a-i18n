import React, { useContext } from 'react';
import { KeyState } from '../../core/constants.js';

import { A } from './Actions.jsx';
import { ActionsKey } from './ActionsKey.jsx';
import { Dropdown } from './Dropdown.jsx';

export const Key = ({ selectedKey, selectedState }) => {

  return (
    <div className='g-key'>
      <div className='lk-locale'>
        <label><span>l</span><span>o</span><span>c</span><span>a</span><span>l</span><span>e</span></label>
      </div>
      <div className='lk-value'>
        <span>{selectedKey}</span>
        {selectedState !== KeyState.Deleted && <ActionsKey value={selectedKey}/>}
      </div>
      <div>
        <Dropdown title="Translations" right={true} as={[A.pinLocales]} />
      </div>
    </div>
  );
};
