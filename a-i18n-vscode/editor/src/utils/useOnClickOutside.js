
import { useCallback, useEffect, useRef } from 'react';


export function useOnClickOutside({
  onTriggered,
  disableClick,
  disableKeys,
  allowAnyKey,
  triggerKeys,
}) {
  const ref = useRef(null);

  const keyListener = useCallback(e => {
    if (allowAnyKey) {
      onTriggered(e);
    } else if (triggerKeys) {
      if (triggerKeys.includes(e.key)) {
        onTriggered(e);
      }
    } else {
      if (e.key === 'Escape') {
        onTriggered(e);
      }
    }
  }, []);

  const clickListener = useCallback(e => {
      if (ref && ref.current && e.target) {
        if (e.target && !ref.current.contains(e.target)) {
          if (document.body.contains(e.target)) { // ignoring clicks on popups
            onTriggered?.(e);
          }
        }
      }
    },
    [ref.current]
  );

  useEffect(() => {
    !disableClick && document.addEventListener('click', clickListener);
    !disableKeys && document.addEventListener('keyup', keyListener);
    return () => {
      !disableClick && document.removeEventListener('click', clickListener);
      !disableKeys && document.removeEventListener('keyup', keyListener);
    };
  }, []);

  return ref;
}