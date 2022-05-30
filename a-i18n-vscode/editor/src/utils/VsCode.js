
import { useEffect } from 'react';

import { ActionProperty } from '../../../core/constants.js';


class VsCodeApi {

  constructor() {
    this.vscode = acquireVsCodeApi();
  }

  post(action, data = {}) {
    data[ActionProperty] = action;
    console.log(`[POST] ${action}`, data);
    this.vscode.postMessage(data);
  }

  // getStateKey(key, defaultValue) {

  //   const state = this.vscode.getState();

  //   console.log('getStateKey', state);
  //   if (state && state[key]) {
  //     return state[key];
  //   }

  //   return defaultValue;
  // }

  // setStateKey(key, value) {
  //   const state = this.vscode.getState() || {};
  //   state[key] = value;
  //   console.log('setStateKey', state);
  //   this.vscode.setState(state);
  // }

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
