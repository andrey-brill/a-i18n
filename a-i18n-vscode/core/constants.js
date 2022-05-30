
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

export const ActionProperty = 'action';

export const Action = {

  Ready: 'Ready',
  Init: 'Init',
  Update: 'Update',

  Query: 'Query',
  SelectKey: 'SelectKey',
  UpdateWorkspaceState: 'UpdateWorkspaceState',

  AddKey: 'AddKey',
  CopyKey: 'CopyKey',
  RenameKey: 'RenameKey',
  DeleteKey: 'DeleteKey',

  RevertUpdate: 'RevertUpdate',
  RevertUpdates: 'RevertUpdates',

  AddComment: 'AddComment',
  RemoveComment: 'RemoveComment',

  Approve: 'Approve',
  Disapprove: 'Disapprove',

  ActivateAutoExport: 'ActivateAutoExport',
  DeactivateAutoExport: 'DeactivateAutoExport',

  PinLocales: 'PinLocales',

  ReportBug: 'ReportBug',
  GoToRepository: 'GoToRepository'
};

export const KeyState = {
  New: 'New',
  Original: 'Original',
  Deleted: 'Deleted',
  Updated: 'Updated'
}