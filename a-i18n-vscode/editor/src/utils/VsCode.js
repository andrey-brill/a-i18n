


class VsCodeApi {

  constructor() {
    this.vscode = acquireVsCodeApi();
  }

  postMessage(obj = {}) {
    console.log('VsCodeApi.postMessage', obj);
    this.vscode.postMessage(obj);
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

export const VsCode = new VsCodeApi();
