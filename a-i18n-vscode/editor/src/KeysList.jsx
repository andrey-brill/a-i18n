import React, { useContext } from 'react';
import { ActionsKey } from './ActionsKey.jsx';
import { State } from './Contexts.jsx';
import { IconStats } from './Icons.jsx';

export const KeysList = ({ className, selectedIndex }) => {

  const state = useContext(State);
  const keys = Object.keys(state.keysInfo || {}).sort();

  console.log('KeysList', keys, state);

  return (
    <div className={'g-keys-list ' + className}>
      {keys.map((key, i) => {

        const { approved, filled } = state.keysInfo[key];
        const statsTitle = `Approved: ${formatPercent(approved)}. Filled: ${formatPercent(filled)}.`;

        return (
          <div key={key} className={`lkl-item ${selectedIndex === i ? 'lkl-selected' : ''}`}>
            <div title={statsTitle}>
              <IconStats approved={approved} filled={filled} />
            </div>
            <div>
              <div className="lkl-key">{key}</div>
            </div>
            <div>
              <ActionsKey value={key} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
const formatPercent = (v = 0) => Math.round(v * 100) + '%';
