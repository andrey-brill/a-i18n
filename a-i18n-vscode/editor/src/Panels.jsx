
import React from 'react';

import { A } from './Actions.jsx';
import { Dropdown } from './Dropdown.jsx';
import { Key } from './Key';
import { Translations } from './Translations.jsx';
import { ResizablePanels } from './utils/ResizablePanels.js';


// export const Panels = () => {
//   return <div className='g-panels'>
//     <div className='g-panels-left'>
//       <Key/>
//       <Translations/>
//     </div>
//     <div className='g-panels-right'>
//       <div className='g-panels-right-top'>
//         <Dropdown title="A-i18n" as={[A.reportBug, A.goToRepository]}/>
//       </div>
//       <div className='g-panels-right-bottom'>
//         <Dropdown title="Changes" as={[A.revertUpdates]}/>
//       </div>
//       <div>Save</div>
//     </div>
//   </div>;
// };


export const Panels = () => {
  return <ResizablePanels className="g-panels"
        direction="row"
        width="100%"
        height="100%"
        panelsSize={[75, 25]}
        sizeUnitMeasure="%"
        resizerColor="#353b48"
        resizerSize="30px">
    <div className='panel-left'>
      <Key/>
      <Translations/>
    </div>
    <ResizablePanels
      direction="column"
      width="100%"
      height="100%"
      panelsSize={[50, 50]}
      sizeUnitMeasure="%"
      resizerColor="#dcdde1"
      resizerSize="100px"
    >
      <div className='l-panels-right-top'>
        <Dropdown title="A-i18n" as={[A.reportBug, A.goToRepository]}/>
      </div>
      <div className='l-panels-right-bottom'>
      <div>
        <Dropdown title="Changes" as={[A.revertUpdates]}/>
      </div>
      <div>Save</div>
      </div>
    </ResizablePanels>
  </ResizablePanels>;
};

