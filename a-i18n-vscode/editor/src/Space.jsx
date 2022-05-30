import React from 'react';


function insertSpacesChildren({ x = 1, children = [], className = '' }) {
  const space = Array(x + 1).join('\u00a0'); // nbsp

  const result = [];
  for (const child of children) {
    if (child) {
      result.push(child);
      result.push(space);
    }
  }
  result.pop();
  return {
    children: result,
    className: 'g-space ' + className
  };
}


export const Space = {
  div: (props = {}) => {
    const { children, className } = insertSpacesChildren(props);
    return <div id={props.id} onClick={props.onClick} className={className}>{children}</div>;
  },
  a: (props = {}) => {
    const { children, className } = insertSpacesChildren(props);
    return <a id={props.id} href='' onClick={props.onClick} title={props.title} className={className}>{children}</a>
  },
  span: (props = {}) => {
    const { children, className } = insertSpacesChildren(props);
    return <span className={className}>{children}</span>
  }
};
