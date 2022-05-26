
import React from 'react';

import { Translation } from './Translation.jsx';

const onChange = (t) => {
  console.log('onChange t', t);
}

const current = {
  value: 'Hello, new world! ',
  approved: false,
  comment: 'Some comment!'
};

const previous = {
  value: 'Hello, new world!',
  approved: true,
  comment: 'Some comment!'
};

export const Translations = () => (
  <div className='g-translations'>
    <Translation locale={'en'} current={current} previous={previous} onChange={onChange}/>
    <Translation locale={'en-US'} current={current} previous={previous} onChange={onChange}/>
    <Translation locale={'uk'} current={current} previous={previous} onChange={onChange}/>
  </div>
);
