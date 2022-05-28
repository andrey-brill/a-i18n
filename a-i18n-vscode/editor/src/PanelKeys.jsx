
import React, { useState } from 'react';

import { A } from './Actions.jsx';
import { Dropdown } from './Dropdown.jsx';
import { KeysList } from './KeysList';


const Query = ({ className }) => {

  const [query, setQuery] = useState('');

  return (
    <input id="query" className={className} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search key..."/>
  )
}



export const PanelKeys = ({ className }) => {

  return (
    <div className={"g-panel-keys " + className}>

      <Dropdown title="A-i18n" as={[A.reportBug, A.goToRepository]}/>

      <div className="lpk-bar">
        <Query className="lpk-query"/>
        <button className="lpk-create">Create</button>
      </div>

      <KeysList className="lpk-keys-list"/>
    </div>
  );
}