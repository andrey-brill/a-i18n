
import React, { useState } from 'react';

import { Action } from '../../core/constants.js';
import { Dropdown } from './Dropdown.jsx';
import { TranslationsOrderModal } from './TranslationsOrderModal.jsx';


export const TranslationsHeader = () =>{

  const [action, setAction] = useState(null);

  return (
    <>
      <Dropdown title="Translations" right={true} actions={[Action.LocalesOrder]} onClick={setAction}/>
      { action === Action.LocalesOrder && <TranslationsOrderModal onClose={() => setAction(null)} />}
    </>
  )
};
