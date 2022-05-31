
import React from 'react';

import { Action } from '../../core/constants.js';
import { IconAdd, IconAddComment, IconAlert, IconApprove, IconCheckOff, IconCheckOn, IconCode, IconCopy, IconEdit, IconPin, IconRemoveComment, IconRevert, IconTrash } from './Icons.jsx';


function a(title, icon, details = title) {
  return { title, icon, details };
}


export function getActionInfo(action) {

  const autoExportInfo = ' (Executing exporter on any changes)';

  switch (action) {

    case Action.AddKey: return a('Add', <IconAdd />, 'Add new key');
    case Action.CopyKey: return a('Copy', <IconCopy />, 'Copy key');
    case Action.RenameKey: return a('Rename', <IconEdit />, 'Rename key');
    case Action.DeleteKey: return a('Delete', <IconTrash />, 'Delete key');

    case Action.RevertUpdate: return a('Revert change', <IconRevert />);
    case Action.RevertUpdates: return a('Revert all changes', <IconRevert />);

    case Action.AddComment: return a('Add comment', <IconAddComment />);
    case Action.RemoveComment: return a('Remove comment', <IconRemoveComment />);

    case Action.Approve: return a('Approve', <IconApprove />, 'Approve translation');
    case Action.Disapprove: return a('Disapprove', <IconCheckOff />, 'Disapprove translation');

    case Action.ActivateAutoExport: return a('Auto-export', <IconCheckOn />, 'Activate auto-export' + autoExportInfo);
    case Action.DeactivateAutoExport: return a('Auto-export', <IconCheckOff />, 'Deactivate auto-export' + autoExportInfo);

    case Action.PinLocales: return a('Pin locales', <IconPin />, 'Pin locales at the top of the list');

    case Action.ReportBug: return a('Report about bug/feature', <IconAlert />);
    case Action.GoToRepository: return a('Open a-i18n repository', <IconCode />);

    default:
      throw new Error('Unknown action: ' + action);
  }
}
