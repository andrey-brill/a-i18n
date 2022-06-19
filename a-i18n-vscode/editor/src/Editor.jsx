
import React, { useEffect, useState } from 'react';

import State from './State.jsx';
import { Action } from '../../core/constants.js';
import { Panels } from './Panels';
import { useMessage, VsCode } from './utils/VsCode.js';
import { IconLoad } from './Icons.jsx';


export const Editor = () => {

  const [state, setState] = useState(null);

  useMessage((action, data) => {
    if (action === Action.State) {
      data.keys = Object.keys(data.keysInfo || {}).sort();
      // console.log(action, data);
      setState(data);
    }
  });

  useEffect(() => {
    VsCode.post(Action.State);
  }, []);

  if (!state || !state.loaded) {
    return (
      <div className='g-loading'>
        <IconLoad/>
      </div>
    );
  }

  if (state.error) {
    const lines = state.error.message.replace(/\n/g, '\n|\n').split('\n');
    return (
      <div className='g-error-state'>
        <div className='les-header'>
          <div>Error</div>
          <div>{state.error.code}</div>
        </div>
        <div className='les-message'>{lines.map((line, i) => line === '|' ? <br key={line + i}/> : <span key={line + i}>{line}</span>)}</div>
      </div>
    );
  }

  return (
    <State.Provider value={state}>
      <Panels/>
    </State.Provider>
  );
}
