import React from 'react';
import { Action } from '../../core/constants.js';
import { onAction } from './Actions.jsx';
import { ActionsKey } from './ActionsKey.jsx';
import { IconStats } from './Icons.jsx';
import { VsCode } from './utils/VsCode.js';


const formatPercent = (v = 0) => Math.round(v * 100) + '%';

const KeysListItem = ({ value, isSelected, isHighlighted, approved, filled, onClick }) => {

  const statsTitle = `Approved: ${formatPercent(approved)}. Filled: ${formatPercent(filled)}.`;

  return (
    <div className={`lkl-item ${isHighlighted ? 'lkl-highlighted' : ''} ${isSelected ? 'lkl-selected' : ''}`}>
      <div title={statsTitle}>
        <IconStats approved={approved} filled={filled} />
      </div>
      <div id={value} className="lkl-key" onClick={onClick}>
        <div>{value}</div>
      </div>
      <div className="lkl-fill"></div>
      <div>
        <ActionsKey value={value} />
      </div>
    </div>
  );
};


export const KeysList = ({ className, keys, keysInfo = {}, highlightedKey, selectedKey }) => {

  const onClick = onAction((action) => {
    VsCode.post(Action.SelectKey, { key: action });
  })

  return (
    <div className={'g-keys-list ' + className}>
      {
        keys.map(key => (
          <KeysListItem key={key}
            value={key}
            onClick={onClick}
            isHighlighted={key === highlightedKey}
            isSelected={key === selectedKey}
            approved={keysInfo[key].approved}
            filled={keysInfo[key].filled}/>
        ))
      }
      { keys.length === 0 && <div className='lkl-empty'>No keys found</div> }
    </div>
  );
};


