import React from 'react';

export const Panels = () => {
  return <div className='g-panels'>
    <div className='g-panels-left g-panel'></div>
    <div className='g-panels-right'>
      <div className='g-panel g-panels-right-top'>Right top</div>
      <div className='g-panel g-panels-right-bottom'>Right bottom</div>
      <div>Save</div>
    </div>
  </div>;
};
