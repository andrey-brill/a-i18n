
import { useEffect } from 'react';

import { ActionProperty } from '../../../core/constants.js';


class VsCodeApi {

  constructor() {
    this.vscode = acquireVsCodeApi();
  }

  post(action, data = {}) {
    data[ActionProperty] = action;
    this.vscode.postMessage(data);
  }

}


export function useMessage(callback) {

  useEffect(() => {

    const listener = (event) => {
      const data = event.data || {};
      callback(data[ActionProperty], data);
    }

    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    };

  }, []);

}


export const VsCode = new VsCodeApi();
