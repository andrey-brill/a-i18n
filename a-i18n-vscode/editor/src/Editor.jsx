
import React, { useEffect, useState } from 'react';

import Context from './Context.jsx';
import { MessageTypes } from '../../core/constants.js';
import { Panels } from './Panels';
import useMessage from './utils/useMessage.js';
import { VsCode } from './utils/VsCode.js';


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
      setState({
        loaded: message.loaded,
        error: message.error
      });
    }
  });

  useEffect(() => {
    VsCode.postMessage({ type: MessageTypes.Ready });
  }, []);

  if (context && state) {
    return (
      <Context.Provider value={context}>
        <Panels/>
      </Context.Provider>
    );
  }

  return (<div>Loading...</div>);
}
