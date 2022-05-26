
import React, { useContext } from 'react';
import { EditorPanels, MessageTypes } from '../../core/constants.js';

import { A } from './Actions.jsx';
import { Context } from './Contexts.jsx';
import { Dropdown } from './Dropdown.jsx';
import { Key } from './Key';
import { Translations } from './Translations.jsx';
import { ResizablePanels } from './utils/ResizablePanels.jsx';
import useMessage from './utils/useMessage.js';


export const Panels = () => {

  const { workspaceState } = useContext(Context);

  useMessage(message => {
    if (message.type === MessageTypes.Update) {
      console.log('TODO remove Panels Update', message);
    }
  });

  const rps = workspaceState[EditorPanels.row.key] || EditorPanels.row.value;
  const cps = workspaceState[EditorPanels.column.key] || EditorPanels.column.value;

  return (
    <ResizablePanels className="g-panels" direction="row" stateKey={EditorPanels.row.key} panelsSize={rps} panelsMinMax={[50, 90]}>
      <div className="lp-left">
        <Key/>
        <Translations/>
      </div>
      <ResizablePanels className="lp-right" direction="column" stateKey={EditorPanels.column.key} panelsSize={cps} panelsMinMax={[25, 75]}>
        <div className="lp-right-top">
          <Dropdown title="A-i18n" as={[A.reportBug, A.goToRepository]}/>
        </div>
        <div className="lp-right-bottom">
          <div>
            <Dropdown title="Changes" as={[A.revertUpdates]}/>
          </div>
          <div>Save</div>
        </div>
      </ResizablePanels>
    </ResizablePanels>
  );
};

