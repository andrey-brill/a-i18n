import React from 'react';

import css from 'bundle-text:./Editor.scss';
import icon from 'data-url:./svg/test.svg';


export const Editor = () => {

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }}/>
      <img src={icon} height={50}/>
      <h1>Hello world!</h1>
    </div>
  );
}
