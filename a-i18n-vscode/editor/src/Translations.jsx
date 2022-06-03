
import React from 'react';
import { unsafeValue } from '../../../a-i18n-core-js/index.js';
import { Action, Preferences } from '../../core/constants.js';
import { useContextState } from './State.jsx';

import { Translation } from './Translation.jsx';
import { unsafeDiff } from './TranslationDiff.jsx';
import { orderByLocalesOrder } from './utils/LocalesOrder.js';
import { VsCode } from './utils/VsCode.js';



function onCopy (e) {
  const selection = document.getSelection();
  const value = unsafeValue(unsafeDiff((selection || '').toString()));
  event.clipboardData.setData('text/plain', value);
  e.preventDefault();
}

function getCurrent(locale, selectedCurrent) {

  const current = selectedCurrent[locale];
  if (current) return current;

  return {
    locale,
    value: '',
    approved: false
  }
}

export const Translations = ({ selectedKey, selectedCurrent, selectedPrevious }) => {

  const { preferences } = useContextState();

  const locales = orderByLocalesOrder(Object.keys(selectedCurrent), preferences[Preferences.LocalesOrder]);

  const onChange = (translation) => {
    translation.key = selectedKey;
    VsCode.post(Action.ApplyChange, { translation });
  }

  return (
    <div className='g-translations' onCopy={onCopy}>
      {
        locales.map(locale => (
          <Translation key={locale} locale={locale} current={getCurrent(locale, selectedCurrent)} previous={selectedPrevious[locale]} onChange={onChange}/>
        ))
      }
    </div>
  )
};
