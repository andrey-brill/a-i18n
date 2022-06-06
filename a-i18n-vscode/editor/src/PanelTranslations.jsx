
import React from 'react';

import { useContextState } from './State.jsx';
import { IconBinoculars } from './Icons.jsx';
import { Key } from './Key';
import { Translations } from './Translations.jsx';
import { KeyState } from '../../../a-i18n-core-js/index.js';


export const PanelTranslations = ({ className }) => {

  const { selectedKey, selectedInfo } = useContextState();

  const content = selectedKey ?
    <>
      <Key selectedKey={selectedKey} selectedState={selectedInfo.state} />
      {selectedInfo.state !== KeyState.Missing && <Translations key={selectedKey} deleted={selectedInfo.state === KeyState.Deleted} selectedCurrent={selectedInfo.current} selectedPrevious={selectedInfo.previous}/>}
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
