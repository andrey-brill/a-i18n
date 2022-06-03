
import React from 'react';

import { getActionInfo } from './utils/getActionInfo.jsx';


export const ActionButton = ({ action, className = '', disabled, highlighted = false, onClick, showTitle=true }) => {
  const a = getActionInfo(action);
  return <button id={disabled ? undefined : action} disabled={disabled} className={`g-action ${ highlighted ? 'la-highlighted' : '' } ${ disabled ? 'la-disabled' : '' } ${className}`} onClick={onClick} title={a.details}>{a.icon}{showTitle ? <span>{a.short}</span> : undefined}</button>;
}

export const ActionLink = ({ action, className = '', disabled = false, onClick, showTitle=true }) => {
  const a = getActionInfo(action);
  return <a id={disabled ? undefined : action} href='' className={'g-action ' + (disabled ? 'la-disabled' : '') + ' ' + className} onClick={onClick} title={a.details}>{a.icon}{showTitle ? <span>{a.title}</span> : undefined}</a>;
}

export const ActionIcon = ({ action, className, disabled }) => <ActionLink action={action} disabled={disabled} className={className} showTitle={false}/>

export const onAction = (onClick) => (e) => {

  e.preventDefault();

  const action = e.target.id || e.currentTarget.id || e.target && e.target.parentElement && e.target.parentElement.id;
  if (action) onClick(action);
}



