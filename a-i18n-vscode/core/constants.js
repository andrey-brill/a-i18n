import { KeyState } from '../../a-i18n-core-js/index.js';

export const Extension = 'a-i18n-vscode';

export const ActionProperty = 'action';

export const Action = {

  State: 'State',

  Query: 'Query',
  CheckKey: 'CheckKey',
  SelectKey: 'SelectKey',
  Preference: 'Preference',

  AddKey: 'AddKey',
  CopyKey: 'CopyKey',
  RenameKey: 'RenameKey',
  DeleteKey: 'DeleteKey',

  RevertChanges: 'RevertChanges',
  RevertAllChanges: 'RevertAllChanges',

  AddComment: 'AddComment',
  RemoveComment: 'RemoveComment',

  Approve: 'Approve',
  Disapprove: 'Disapprove',

  ApplyChange: 'ApplyChange',

  AutoExport: 'AutoExport',

  LocalesOrder: 'LocalesOrder',

  UpdateGlobalPreference: 'UpdateGlobalPreference',

  ReportBug: 'ReportBug',
  GoToRepository: 'GoToRepository',

  Save: 'Save',
  Export: 'Export',
  SaveAndExport: 'SaveAndExport'
};

export const KeyStateIcon = {
  [KeyState.Original]: '=',
  [KeyState.New]: '+',
  [KeyState.Changed]: '±',
  [KeyState.Deleted]: '-',
  [KeyState.Missing]: '?'
}

export const KeyStateOrder = [ KeyState.New, KeyState.Changed, KeyState.Deleted ];


export const Preferences = {

  // public (package.json)
  LocalesOrder: 'LocalesOrder',

  // private (saved only in workspace state)
  RowPanelsSize: 'RowPanelsSize',
  ColumnPanelsSize: 'ColumnPanelsSize'
}

export const workspaceKey = (key) => {
  return Extension + ':' + key;
}

export const EditorPanels = {
  row: {
    key: Preferences.RowPanelsSize,
    value: [75, 25]
  },
  column: {
    key: Preferences.ColumnPanelsSize,
    value: [60, 40]
  }
};
