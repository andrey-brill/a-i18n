import React, { useEffect } from 'react';

import { Panels } from './Panels';

const vscode = acquireVsCodeApi();

export const Editor = () => {

  useEffect(() => {

    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        console.log('set message', message);
    });

    vscode.postMessage({ type: 'READY' });
  }, []);

  return (
    <Panels/>
  );
}
