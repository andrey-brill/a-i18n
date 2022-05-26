
import React from 'react';

import { IconAdd, IconAddComment, IconAlert, IconApprove, IconCheckOff, IconCheckOn, IconCode, IconCopy, IconEdit, IconPin, IconRemoveComment, IconRevert, IconTrash } from './Icons.jsx';
import { Space } from './Space';

export const A = {

  createKey: 1,
  copyKey: 1,
  renameKey: 1,
  deleteKey: 1,

  revertUpdate: 1,
  revertUpdates: 1,

  addComment: 1,
  removeComment: 1,

  approve: 1,
  disapprove: 1,

  activateAutoExport: 1,
  deactivateAutoExport: 1,

  pinLocales : 1,

  reportBug: 1,
  goToRepository: 1
};

Object.keys(A).forEach(key => { A[key] = key ;});


function a(title, icon, details = title) {
  return { title, icon, details };
}

function getAction (action) {

  const autoExportInfo = ' (Executing exporter on any changes)';

  switch (action) {

    case A.createKey: return a('Create', <IconAdd/>, 'Create key');
    case A.copyKey: return a('Copy key', <IconCopy/>);
    case A.renameKey: return a('Rename key', <IconEdit/>);
    case A.deleteKey: return a('Delete key', <IconTrash/>);

    case A.revertUpdate: return a('Revert change', <IconRevert/>);
    case A.revertUpdates: return a('Revert all changes', <IconRevert/>);

    case A.addComment: return a('Add comment', <IconAddComment/>);
    case A.removeComment: return a('Remove comment', <IconRemoveComment/>);

    case A.approve: return a('Approve', <IconApprove/>, 'Approve translation');
    case A.disapprove: return a('Disapprove', <IconCheckOff/>, 'Disapprove translation');

    case A.activateAutoExport: return a('Auto-export', <IconCheckOn/>, 'Activate auto-export' + autoExportInfo);
    case A.deactivateAutoExport: return a('Auto-export', <IconCheckOff/>, 'Deactivate auto-export' + autoExportInfo);

    case A.pinLocales: return a('Pin locales', <IconPin/>, 'Pin locales at the top of the list');

    case A.reportBug: return a('Report about bug/feature', <IconAlert/>);
    case A.goToRepository: return a('Open a-i18n repository', <IconCode/>);

    default:
      throw new Error('Unknown action: ' + action);
  }
}

const Action = ({ a, disabled, onClick, showTitle }) => {
  const action = getAction(a);
  return <Space.a className={'g-action ' + (disabled ? 'la-disabled' : '')} x={showTitle ? 2 : 1} id={disabled ? undefined : a} onClick={onClick} title={action.details}>{action.icon}{showTitle ? action.title : undefined}</Space.a>;
}

export const ActionLink = ({a, onClick, disabled}) => <Action a={a} onClick={onClick} disabled={disabled} showTitle={true}/>

export const ActionIcon = ({a, onClick, disabled}) => <Action a={a} onClick={onClick} disabled={disabled} showTitle={false}/>

export const onAction = (onClick) => (e) => {

  e.preventDefault();

  const a = e.target.id || e.currentTarget.id;
  if (a) onClick(a);
}