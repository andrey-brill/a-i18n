import React, { useEffect, useState } from 'react';

import css from 'bundle-text:./Editor.scss';
import icon from 'data-url:./svg/test.svg';
import { Panels } from './Panels';

const vscode = acquireVsCodeApi();

export const Editor = () => {

  // const [hello, setHello] = useState('Hello');

  useEffect(() => {

    window.addEventListener('message', event => {
        const message = event.data; // The JSON data our extension sent
        console.log('set message', message);
        // setHello(JSON.stringify(message));
    });

    vscode.postMessage({ type: 'READY' });
  }, []);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }}/>
      <Panels/>
      {/* <img src={icon} height={50}/> */}
      {/* <h1>{hello}</h1> */}
    </div>
  );
}
