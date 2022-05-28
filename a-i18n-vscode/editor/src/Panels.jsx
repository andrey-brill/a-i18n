
import React, { useContext } from 'react';
import { EditorPanels, MessageTypes } from '../../core/constants.js';

import { A } from './Actions.jsx';
import { Context } from './Contexts.jsx';
import { Dropdown } from './Dropdown.jsx';
import { PanelKeys } from './PanelKeys.jsx';
import { PanelTranslations } from './PanelTranslations';
import { ResizablePanels } from './utils/ResizablePanels.jsx';


export const Panels = () => {

  const { workspaceState } = useContext(Context);

  const rps = workspaceState[EditorPanels.row.key] || EditorPanels.row.value;
  const cps = workspaceState[EditorPanels.column.key] || EditorPanels.column.value;

  return (
    <ResizablePanels className="g-panels" direction="row" stateKey={EditorPanels.row.key} panelsSize={rps} panelsMinMax={[50, 90]}>
      <PanelTranslations className="lp-left"/>
      <ResizablePanels className="lp-right" direction="column" stateKey={EditorPanels.column.key} panelsSize={cps} panelsMinMax={[25, 75]}>
        <PanelKeys className="lp-right-top"/>
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

