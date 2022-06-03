
import React, { useRef, useState } from 'react';

import { simpleDebounce, strNotEmpty } from '../../../a-i18n-core-js/index.js';
import { Action } from '../../core/constants.js';

import { useContextState } from './State.jsx';
import { Dropdown } from './Dropdown.jsx';
import { InputConnector, Input } from './Input.jsx';
import { PanelKeysList } from './KeysLists';
import { VsCode } from './utils/VsCode.js';


class QueryHandler extends InputConnector {

  constructor(rerender) {
    super();

    this.query = '';
    this.focused = false;

    this.highlightedKey = null; // not selected
    this.keys = [];

    this.rerender = rerender;
    this.debounceUpdate = simpleDebounce(() => this.requestQuery(), 200);

    Object.assign(this.keyDown, {
      ArrowUp: this.onArrowUp,
      ArrowDown: this.onArrowDown,
      Enter: this.onEnter
    });
  }

  onArrowUp = () => {

    let index = this.keys.indexOf(this.highlightedKey) - 1;
    if (this.highlightedKey && index >= 0 && this.keys[index]) {
      this.highlightedKey = this.keys[index];
      this.rerender();
    } else if (this.highlightedKey && index === -1 && strNotEmpty(this.query)) {
      this.highlightedKey = null;
      this.rerender();
    }
  }

  onArrowDown = () => {
    let index = this.keys.indexOf(this.highlightedKey) + 1;
    if (this.highlightedKey && index > 0) {
      this.highlightedKey = this.keys[index] || this.keys[0];
      this.rerender();
    } else if (!this.highlightedKey && this.keys.length > 0) {
      this.highlightedKey = this.keys[0];
      this.rerender();
    }
  }

  onEnter = () => {
    if (this.highlightedKey) {
      VsCode.post(Action.SelectKey, { key: this.highlightedKey });
    } else {
      this.handleClick();
    }
  }

  handleClick() {
    if (strNotEmpty(this.query)) {
      VsCode.post(Action.AddKey, { key: this.query.trim() });
    }
  }

  handleChange(query = '') {
    this.query = query;
    this.debounceUpdate();
  }

  handleFocus(focused) {
    this.focused = focused;
    this.rerender();
  }

  requestQuery() {

    if (this.query !== this.requestedQuery) {

      this.requestedQuery = this.query;

      VsCode.post(Action.Query, { query: this.requestedQuery });
    }
  }

  getHighlightedKey(keys) {

    this.keys = keys;

    if (this.previousKeys !== this.keys) {

      if (this.keys.length <= 0) {
        this.highlightedKey = null;
      } else {
        this.highlightedKey = this.highlightedKey && this.keys.indexOf(this.highlightedKey) >= 0 ? this.highlightedKey : this.keys[0];
      }

      this.previousKeys = this.keys;
    }

    return this.focused ? this.highlightedKey : null;
  }

}

export const PanelKeys = ({ className }) => {

  const state = useContextState();

  const [_, rerender] = useState();

  const inputRef = useRef();
  if (!inputRef.current) {
    inputRef.current = new QueryHandler(() => rerender(Math.random()));
  }

  const highlightedKey = inputRef.current.getHighlightedKey(state.keys);

  return (
    <div className={"g-panel-keys " + className}>

      <Dropdown title="A-i18n" actions={[Action.ReportBug, Action.GoToRepository]}/>

      <div className="lpk-bar">
        <Input placeholder="Search key..."
          resetOnEscape={true}
          connector={inputRef.current}
          action={Action.AddKey}
          actionHighlighted={!highlightedKey && inputRef.current.focused}/>
      </div>

      <PanelKeysList className="lpk-keys-list"
        keys={state.keys}
        keysInfo={state.keysInfo}
        keysInfoReachLimit={state.keysInfoReachLimit}
        changedKeys={state.changedKeys}
        selectedKey={state.selectedKey}
        highlightedKey={highlightedKey}/>
    </div>
  );
}