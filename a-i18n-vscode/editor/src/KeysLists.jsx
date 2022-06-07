import React, { Fragment, useRef } from 'react';
import { Action, KeyState, KeyStateIcon, KeyStateOrder } from '../../core/constants.js';
import { onAction } from './Actions.jsx';
import { ActionsKey } from './ActionsKey.jsx';
import { IconStats } from './Icons.jsx';
import { KeyStateTag } from './KeyStateTag.jsx';
import { VsCode } from './utils/VsCode.js';


const formatPercent = (v = 0) => Math.round(v * 100) + '%';

const KeysListItem = ({ value, highlightedKey, selectedKey, onClick, state, children }) => {

  const el = useRef();
  const previousHighlighted = useRef();

  const isHighlighted = highlightedKey === value;
  if (el.current && previousHighlighted.current !== isHighlighted && isHighlighted) {
    el.current.scrollIntoView(false);
  }

  previousHighlighted.current = isHighlighted;

  return (
    <div ref={el} className={`lkl-item ${isHighlighted ? 'lkl-highlighted' : ''} ${(selectedKey === value) ? 'lkl-selected' : ''}`}>
      {children}
      <div id={value} className="lkl-key" onClick={onClick}>
        <div>{value}</div>
      </div>
      <div className="lkl-fill"></div>
      <div>
        <ActionsKey value={value} state={state}/>
      </div>
    </div>
  )
};


export const PanelKeysList = ({ className, keys, keysInfo = {}, changedKeys = {}, highlightedKey, selectedKey, keysInfoReachLimit = false }) => {

  const onClick = onAction((action) => {
    VsCode.post(Action.SelectKey, { key: action });
  })

  return (
    <div className={'g-keys-list ' + className}>
      {
        keys.map(key => {

          const { approved, filled } = keysInfo[key];
          const statsTitle = `Approved: ${formatPercent(approved)}. Filled: ${formatPercent(filled)}.`;

          return (
          <KeysListItem key={key}
            value={key}
            state={changedKeys[key]}
            onClick={onClick}
            highlightedKey={highlightedKey}
            selectedKey={selectedKey}>
            <div title={statsTitle}>
              <IconStats approved={approved} filled={filled} />
            </div>
          </KeysListItem>
        )})
      }
      { keys.length === 0 && <div className='lkl-info'>No keys found</div> }
      { keysInfoReachLimit && <div className='lkl-info'>Showing only first { keys.length } keys</div> }
    </div>
  );
};


function buildGrouped(changedKeys = {}) {

  const keys = Object.keys(changedKeys);

  const map = {};
  for (const state of KeyStateOrder) {
    map[state] = [];
  }

  for (const key of keys) {
    const group = map[changedKeys[key]];
    if (group) group.push(key);
  }

  const grouped = [];
  for (const state of KeyStateOrder) {
    const group = map[state].sort();
    if (group.length > 0) {
      grouped.push({ state, group });
    }
  }

  return { keys, grouped };
}

export const PanelChangesList = ({ className, changedKeys = {}, selectedKey }) => {

  const onClick = onAction((action) => {
    VsCode.post(Action.SelectKey, { key: action });
  })

  const { keys, grouped } = buildGrouped(changedKeys);

  return (
    <div className={'g-keys-list ' + className}>
      {
        grouped.map(({ state, group  }) => (
          <Fragment key={state}>
            <div className="lkl-group">
              <KeyStateTag state={state}/>
            </div>
            {
              group.map(key => {
                return (
                <KeysListItem key={key}
                  value={key}
                  state={state}
                  onClick={onClick}
                  selectedKey={selectedKey}>
                  <div className={`g-color-${state.toLowerCase()}`} title={state}>{KeyStateIcon[state]}</div>
                </KeysListItem>
              )})
            }
          </Fragment>
        ))
      }
      { keys.length === 0 && <div className='lkl-info'>No changes</div> }
    </div>
  );
};

