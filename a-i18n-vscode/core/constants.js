
export const Extension = 'a-i18n-vscode';

export const EditorPanels = {
  row: {
    key: Extension + ':row-panels-size',
    value: [75, 25]
  },
  column: {
    key: Extension + ':column-panels-size',
    value: [60, 40]
  }
};


export const MessageTypes = {
  Ready: 'Ready',
  Init: 'Init',
  Update: 'Update',
  UpdateWorkspaceState: 'UpdateWorkspaceState'
}

export const KeyState = {
  New: 'New',
  Original: 'Original',
  Deleted: 'Deleted',
  Updated: 'Updated'
}