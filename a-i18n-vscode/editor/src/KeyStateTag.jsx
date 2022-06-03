
import React from 'react';

export const KeyStateTag = ({ state }) => (
  <span className={`g-key-state-tag g-color-${state.toLowerCase()}`}>{state}</span>
);

