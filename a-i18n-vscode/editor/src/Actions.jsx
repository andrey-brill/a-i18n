
import React from 'react';

import { Action } from '../../core/constants.js';
import { IconAdd, IconAddComment, IconAlert, IconApprove, IconCheckOff, IconCheckOn, IconCode, IconCopy, IconEdit, IconPin, IconRemoveComment, IconRevert, IconTrash } from './Icons.jsx';
import { Space } from './Space';


function a (title, icon, details = title) {
  return { title, icon, details };
}

function actionInfo (action) {

  const autoExportInfo = ' (Executing exporter on any changes)';

  switch (action) {

    case Action.AddKey: return a('Add', <IconAdd/>, 'Add new key');
    case Action.CopyKey: return a('Copy key', <IconCopy/>);
    case Action.RenameKey: return a('Rename key', <IconEdit/>);
    case Action.DeleteKey: return a('Delete key', <IconTrash/>);

    case Action.RevertUpdate: return a('Revert change', <IconRevert/>);
    case Action.RevertUpdates: return a('Revert all changes', <IconRevert/>);

    case Action.AddComment: return a('Add comment', <IconAddComment/>);
    case Action.RemoveComment: return a('Remove comment', <IconRemoveComment/>);

    case Action.Approve: return a('Approve', <IconApprove/>, 'Approve translation');
    case Action.Disapprove: return a('Disapprove', <IconCheckOff/>, 'Disapprove translation');

    case Action.ActivateAutoExport: return a('Auto-export', <IconCheckOn/>, 'Activate auto-export' + autoExportInfo);
    case Action.DeactivateAutoExport: return a('Auto-export', <IconCheckOff/>, 'Deactivate auto-export' + autoExportInfo);

    case Action.PinLocales: return a('Pin locales', <IconPin/>, 'Pin locales at the top of the list');

    case Action.ReportBug: return a('Report about bug/feature', <IconAlert/>);
    case Action.GoToRepository: return a('Open a-i18n repository', <IconCode/>);

    default:
      throw new Error('Unknown action: ' + action);
  }
}


export const ActionButton = ({ action, className = '', disabled, highlighted = false, onClick }) => {
  const a = actionInfo(action);
  return <button id={disabled ? undefined : action} className={`g-action ${ highlighted ? 'la-highlighted' : '' } ${ disabled ? 'la-disabled' : '' } ${className}`} onClick={onClick} title={a.details}>{a.icon}<span>{a.title}</span></button>;
}

export const ActionLink = ({ action, className = '', disabled, onClick, showTitle=true }) => {
  const a = actionInfo(action);
  return <a id={disabled ? undefined : action} href='' className={'g-action ' + (disabled ? 'la-disabled' : '') + ' ' + className} onClick={onClick} title={a.details}>{a.icon}{showTitle ? <span>{a.title}</span> : undefined}</a>;
}

export const ActionIcon = ({ action, className, disabled }) => <ActionLink action={action} disabled={disabled} className={className} showTitle={false}/>

export const onAction = (onClick) => (e) => {

  e.preventDefault();

  const action = e.target.id || e.currentTarget.id;
  if (action) onClick(action);
}