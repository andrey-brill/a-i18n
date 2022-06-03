import React from 'react';

import { KeyState } from '../../core/constants.js';
import { ActionsKey } from './ActionsKey.jsx';
import { KeyStateTag } from './KeyStateTag.jsx';
import { TranslationsHeader } from './TranslationsHeader';

export const Key = ({ selectedKey, selectedState }) => {

  return (
    <div className='g-key'>
      <div className='lk-locale'>
        <label><span>l</span><span>o</span><span>c</span><span>a</span><span>l</span><span>e</span></label>
      </div>
      <div className='lk-value'>
        <span className='lk-key'>{selectedKey}</span>
        <KeyStateTag state={selectedState}/>
        {selectedState !== KeyState.Deleted && <ActionsKey value={selectedKey}/>}
      </div>
      <div>
        {selectedState !== KeyState.Deleted && <TranslationsHeader/>}
      </div>
    </div>
  );
};
