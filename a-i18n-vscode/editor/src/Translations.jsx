
import React, { useRef } from 'react';

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

  const updater = useRef(1);
  if (selectedForce) {
    updater.current = updater.current + 1;
  }

  return (
    <div className='g-translations' onCopy={onCopy}>
      {
        locales.map(locale => {

          const renderKey = buildFK(locale, selectedKey) + '#' + updater.current;

          return (
            <Translation key={renderKey} selectedKey={selectedKey} deleted={deleted} locale={locale} current={selectedCurrent[locale]} previous={selectedPrevious[locale]}/>
          )}
        )
      }
    </div>
  )
};
