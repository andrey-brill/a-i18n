
import React, { useEffect, useState } from 'react';

import { Context, State } from './Contexts.jsx';
import { MessageTypes } from '../../core/constants.js';
import { Panels } from './Panels';
import useMessage from './utils/useMessage.js';
import { VsCode } from './utils/VsCode.js';
import { IconLoad } from './Icons.jsx';


export const Editor = () => {

  const [context, setContext] = useState(null);
  const [state, setState] = useState({});

  useMessage(message => {

    console.log(message.type, message);

    if (message.type === MessageTypes.Init) {
      setContext({
        workspaceState: message.workspaceState || {}
      });
    }

    if (message.type === MessageTypes.Update) {
      setState(message);
    }
  });

  useEffect(() => {
    VsCode.postMessage({ type: MessageTypes.Ready });
  }, []);

  if (context && state) {
    return (
      <Context.Provider value={context}>
        <State.Provider value={state}>
          <Panels/>
        </State.Provider>
      </Context.Provider>
    );
  }

  return (
    <div className='g-loading'>
      <IconLoad/>
    </div>
  );
}
