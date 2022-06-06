
import React from 'react';

import { Action } from '../../../core/constants.js';
import { IconAdd, IconAddComment, IconAlert, IconApprove, IconCheckOff, IconCheckOn, IconCode, IconCopy, IconEdit, IconExport, IconPin, IconRemoveComment, IconRevert, IconSave, IconTrash } from '../Icons.jsx';


function a(icon, ...rest) {
  [p0, p1, p2] = rest;
  switch (rest.length) {
    case 1:
      return { icon, short: p0, title: p0, details: p0 };
    case 2:
      return { icon, short: p0, title: p0, details: p1 };
    case 3:
      return { icon, short: p0, title: p1, details: p2 };
    default:
      throw new Error('Invalid a.rest: ' + rest);
  }
}


export function getActionInfo(action) {


  switch (action) {

    case Action.AddKey: return a(<IconAdd />, 'Add', 'Add new key');
    case Action.CopyKey: return a(<IconCopy />, 'Copy', 'Copy key');
    case Action.RenameKey: return a(<IconEdit />, 'Rename', 'Rename key');
    case Action.DeleteKey: return a(<IconTrash />, 'Delete', 'Delete key');

    case Action.RevertChanges: return a(<IconRevert />, 'Revert changes');
    case Action.RevertAllChanges: return a(<IconRevert />, 'Revert all changes');

    case Action.AddComment: return a(<IconAddComment />, 'Add comment');
    case Action.RemoveComment: return a(<IconRemoveComment />, 'Remove comment');

    case Action.Approve: return a(<IconApprove />, 'Approve', 'Approve translation');
    case Action.Disapprove: return a(<IconCheckOff />, 'Disapprove', 'Disapprove translation');

    case Action.LocalesOrder:
      const title = `Change locales' order`;
      return a(<IconPin />, 'Save', title, title);

    case Action.ReportBug: return a(<IconAlert />, 'Report about bug/feature');
    case Action.GoToRepository: return a(<IconCode />, 'Open a-i18n repository');

    case Action.AutoExport: return a(null, 'Auto-export', 'Activate/deactivate auto-export (running exporter on any changes)');
    case Action.UpdateGlobalPreference: return a(null, 'Save as global extension preference');

    case Action.Save: return a(<IconSave />, 'Save', 'Save changes to i18n-files');
    case Action.Export: return a(<IconExport />, 'Export', 'Run i18n-exporter');
    case Action.SaveAndExport: return a(<IconSave />, 'Save & Export', 'Save changes to i18n-files and run exporter');

    default:
      throw new Error('Unknown action: ' + action);
  }
}
