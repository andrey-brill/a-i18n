
import React from 'react';

import { useContextState } from './State.jsx';
import { EditorPanels } from '../../core/constants.js';
import { PanelChanges } from './PanelChanges';
import { PanelKeys } from './PanelKeys.jsx';
import { PanelTranslations } from './PanelTranslations';
import { ResizablePanels } from './utils/ResizablePanels.jsx';


export const Panels = () => {

  const { preferences } = useContextState();

  const rps = preferences[EditorPanels.row.key] || EditorPanels.row.value;
  const cps = preferences[EditorPanels.column.key] || EditorPanels.column.value;

  return (
    <ResizablePanels className="g-panels" direction="row" stateKey={EditorPanels.row.key} panelsSize={rps} panelsMinMax={[50, 90]}>
      <PanelTranslations className="lp-left"/>
      <ResizablePanels className="lp-right" direction="column" stateKey={EditorPanels.column.key} panelsSize={cps} panelsMinMax={[25, 75]}>
        <PanelKeys className="lp-right-top"/>
        <PanelChanges className="lp-right-bottom"/>
      </ResizablePanels>
    </ResizablePanels>
  );
};

