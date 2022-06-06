
import React, { createRef } from 'react';

import { buildFK, unsafeValue } from '../../../a-i18n-core-js/index.js';
import { Preferences } from '../../core/constants.js';
import { useContextState } from './State.jsx';
import { Translation } from './Translation.jsx';
import { unsafeDiff } from './TranslationDiff.jsx';
import { orderByLocalesOrder } from './utils/LocalesOrder.js';


function onCopy (e) {
  const selection = document.getSelection();
  const value = unsafeValue(unsafeDiff((selection || '').toString()));
  event.clipboardData.setData('text/plain', value);
  e.preventDefault();
}

export const Translations = ({ deleted, selectedCurrent, selectedPrevious }) => {

  const { selectedKey, preferences, selectedForce } = useContextState();

  const locales = orderByLocalesOrder(Object.keys(selectedCurrent), preferences[Preferences.LocalesOrder]);

  const updater = createRef();
  if (selectedForce || !updater.current) {
    updater.current = (updater.current || 1) + 1;
  }

  return (
    <div className='g-translations' onCopy={onCopy}>
      {
        locales.map(locale => (
          <Translation key={buildFK(locale, selectedKey) + '#' + updater.current} selectedKey={selectedKey} deleted={deleted} locale={locale} current={selectedCurrent[locale]} previous={selectedPrevious[locale]}/>
        ))
      }
    </div>
  )
};
