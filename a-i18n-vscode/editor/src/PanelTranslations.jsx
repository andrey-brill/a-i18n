
import React from 'react';

import { KeyState } from '../../core/constants.js';
import { useContextState } from './State.jsx';
import { IconBinoculars } from './Icons.jsx';
import { Key } from './Key';
import { Translations } from './Translations.jsx';


export const PanelTranslations = ({ className }) => {

  const { selectedKey, selectedState, selectedCurrent, selectedPrevious } = useContextState();

  const content = selectedKey ?
    <>
      <Key selectedKey={selectedKey} selectedState={selectedState} />
      {selectedState !== KeyState.Deleted && <Translations key={selectedKey} selectedKey={selectedKey} selectedCurrent={selectedCurrent} selectedPrevious={selectedPrevious}/>}
    </>
    :
    <div className='lpt-not-selected'>
      <IconBinoculars/>
      <span>Select key</span>
      <span>to edit translations</span>
    </div>;

  return (
    <div className={'g-panel-translations ' + className}>{content}</div>
  );
};
