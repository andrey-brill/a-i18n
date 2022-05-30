import React, { useContext } from 'react';

import { Action, KeyState } from '../../core/constants.js';
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
        <Dropdown title="Translations" right={true} actions={[Action.PinLocales]} />
      </div>
    </div>
  );
};
