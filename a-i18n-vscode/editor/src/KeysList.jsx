import React from 'react';
import { ActionsKey } from './ActionsKey.jsx';
import { IconStats } from './Icons.jsx';


const formatPercent = (v = 0) => Math.round(v * 100) + '%';

const KeysListItem = ({ value, isSelected, isHighlighted, approved, filled }) => {

  const statsTitle = `Approved: ${formatPercent(approved)}. Filled: ${formatPercent(filled)}.`;

  return (
    <div className={`lkl-item ${isHighlighted ? 'lkl-highlighted' : ''} ${isSelected ? 'lkl-selected' : ''}`}>
      <div title={statsTitle}>
        <IconStats approved={approved} filled={filled} />
      </div>
      <div>
        <div className="lkl-key">{value}</div>
      </div>
      <div>
        <ActionsKey value={value} />
      </div>
    </div>
  );
};


export const KeysList = ({ className, keys, keysInfo = {}, highlightedKey, selectedKey }) => {

  return (
    <div className={'g-keys-list ' + className}>
      {
        keys.map(key => (
          <KeysListItem key={key}
            value={key}
            isHighlighted={key === highlightedKey}
            isSelected={key === selectedKey}
            approved={keysInfo[key].approved}
            filled={keysInfo[key].filled}/>
        ))
      }
    </div>
  );
};


