
import React, { useContext, useRef, useState } from 'react';

import { simpleDebounce$ } from '../../../a-i18n-core-js/index.js';
import { Action } from '../../core/constants.js';

import { State } from './Contexts.jsx';
import { Dropdown } from './Dropdown.jsx';
import { InputConnector, Input } from './Input.jsx';
import { KeysList } from './KeysList';
import { VsCode } from './utils/VsCode.js';


class QueryHandler extends InputConnector {

  constructor(rerender) {
    super();

    this.query = '';

    this.highlightedKey = null; // not selected
    this.keys = [];

    this.rerender = rerender;
    this.debounceUpdate = simpleDebounce$(() => this.requestQuery(), 300);

    this.keyDown = {
      ArrowUp: this.onArrowUp,
      ArrowDown: this.onArrowDown,
      Enter: this.onEnter
    }
  }

  onArrowUp = () => {
    let index = this.keys.indexOf(this.highlightedKey) - 1;
    if (this.highlightedKey && index >= 0 && this.keys[index]) {
      this.highlightedKey = this.keys[index];
      this.rerender();
    }
  }

  onArrowDown = () => {
    let index = this.keys.indexOf(this.highlightedKey) + 1;
    if (this.highlightedKey && index > 0 && this.keys[index]) {
      this.highlightedKey = this.keys[index];
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
    if (this.query && this.query.trim().length > 0) {
      VsCode.post(Action.AddKey, { key: this.query.trim() });
    }
  }

  handleKeyDown(e) {

    console.log('keydown', e.key);

    const handler = this.keyDown[e.key];
    if (handler) {
      e.preventDefault();
      handler(e);
    }
  }

  handleChange(query = '') {
    this.query = query;
    this.debounceUpdate();
  }

  requestQuery() {

    if (this.query !== this.requestedQuery) {

      this.requestedQuery = this.query;

      VsCode.post(Action.Query, { query: this.requestedQuery });
    }
  }

  getHighlightedKey(keys) {

    this.keys = keys;

    if (this.keys.length <= 0) {
      this.highlightedKey = null;
    } else {
      this.highlightedKey = this.highlightedKey && this.keys.indexOf(this.highlightedKey) >= 0 ? this.highlightedKey : this.keys[0];
    }

    return this.highlightedKey;
  }

}

export const PanelKeys = ({ className }) => {

  const state = useContext(State);
  const keys = Object.keys(state.keysInfo || {}).sort();

  const [_, rerender] = useState();

  const inputRef = useRef();
  if (!inputRef.current) {
    inputRef.current = new QueryHandler(() => rerender(Math.random()));
  }

  const highlightedKey = inputRef.current.getHighlightedKey(keys);

  return (
    <div className={"g-panel-keys " + className}>

      <Dropdown title="A-i18n" actions={[Action.ReportBug, Action.GoToRepository]}/>

      <div className="lpk-bar">
        <Input placeholder="Search key..." onChange={inputRef.current.onChange} onClick={inputRef.current.onClick} onKeyDown={inputRef.current.onKeyDown}
          action={Action.AddKey}
          highlightAction={!highlightedKey}/>
      </div>

      <KeysList className="lpk-keys-list" keys={keys} keysInfo={state.keysInfo} selectedKey={state.selectedKey} highlightedKey={highlightedKey}/>
    </div>
  );
}