
import React, { useContext } from 'react';

import { KeyState } from '../../core/constants.js';
import { State } from './Contexts.jsx';
import { IconBinoculars } from './Icons.jsx';
import { Key } from './Key';
import { Translations } from './Translations.jsx';


export const PanelTranslations = ({ className }) => {

  const state = useContext(State);
  const { selectedKey, selectedState } = state;

  const content = selectedKey ?
    <>
      <Key selectedKey={selectedKey} selectedState={selectedState} />
      {selectedState !== KeyState.Deleted && <Translations />}
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
