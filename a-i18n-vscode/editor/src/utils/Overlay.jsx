

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';


export const Overlay = ({ children }) => {

  const [overlay, setOverlay] = useState(null);

  useEffect(() => {

    const OverlayId = 'overlay';

    const overlayEl = document.createElement('div');
    overlayEl.className = 'g-overlay';

    document.getElementById(OverlayId).appendChild(overlayEl);
    setOverlay(overlayEl);

    return () => {
      document.getElementById(OverlayId).removeChild(overlayEl);
    }
  }, []);

  if (!overlay) {
    return null;
  }

  return createPortal(children, overlay);
}
