
import React from 'react';

import { Action } from '../../core/constants.js';
import { useContextState } from './State.jsx';
import { Dropdown } from './Dropdown.jsx';
import { PanelChangesList } from './KeysLists.jsx';
import { CheckBox } from './CheckBox.jsx';
import { VsCode } from './utils/VsCode.js';
import { ActionButton, onAction } from './Actions.jsx';


const onAutoExport = (value) => {
  VsCode.post(Action.AutoExport, { value });
}

export const PanelChanges = ({ className }) => {

  const { autoExport, selectedKey, changedKeys } = useContextState();
  const onClick = onAction(action => VsCode.post(action));

  return (
    <div className={`g-panel-changes ${className}`}>

      <Dropdown title="Changes" actions={[Action.RevertAllChanges]} onClick={onClick}/>
      <PanelChangesList className="lpc-keys-list" changedKeys={changedKeys} selectedKey={selectedKey}/>

      <div className='lpc-bar' onClick={onClick}>
        <CheckBox value={autoExport} setValue={onAutoExport} action={Action.AutoExport}/>
        { autoExport && <ActionButton className="lpc-save" action={Action.SaveAndExport}/> }
        { !autoExport && <ActionButton action={Action.Export} showTitle={false}/> }
        { !autoExport && <ActionButton className="lpc-save" action={Action.Save}/> }
      </div>
    </div>
  );
};
