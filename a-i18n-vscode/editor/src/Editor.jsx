
import React, { useEffect, useState } from 'react';

import { Context, State } from './Contexts.jsx';
import { Action } from '../../core/constants.js';
import { Panels } from './Panels';
import { useMessage, VsCode } from './utils/VsCode.js';
import { IconLoad } from './Icons.jsx';


export const Editor = () => {

  const [context, setContext] = useState(null);
  const [state, setState] = useState({});

  useMessage((action, data) => {

    console.log(action, data);

    if (action === Action.Init) {
      setContext({
        workspaceState: data.workspaceState || {}
      });
    }

    if (action === Action.Update) {
      setState(data);
    }
  });

  useEffect(() => {
    VsCode.post(Action.Ready);
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
