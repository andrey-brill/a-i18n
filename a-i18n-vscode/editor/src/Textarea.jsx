
import React, { useEffect, useRef, useState } from 'react';

import { safeValue, simpleDebounce, unsafeValue } from '../../../a-i18n-core-js/index.js';

export const Textarea = ({ initialValue = '', setValue }) => {

  const ref = useRef();

  const [textarea, setTextarea] = useState(unsafeValue(initialValue));

  const state = useRef();
  if (!state.current) {
    state.current = {

      lastUpdated: initialValue,

      onChange: (event) => {
        setTextarea(unsafeValue(event.target.value));
      },

      onResize: () => {
        ref.current.style.height = "auto";
        ref.current.style.height = ref.current.scrollHeight + "px";
      },

      debounceSet: simpleDebounce(() => {

        const value = safeValue(ref.current.value);

        if (state.current.lastUpdated !== value) {
          state.current.lastUpdated = value;
          setValue(value);
        }
      }, 500)
    }
  }

  useEffect(() => state.current.debounceSet(), [textarea])

  useEffect(() => {

    state.current.onResize();

    const observer = new MutationObserver(() => {
      state.current.onResize();
    });

    observer.observe(ref.current, {
      childList: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
    };

  }, []);

  return (<textarea className='g-textarea' ref={ref} value={textarea} onChange={state.current.onChange} rows={1}/>);
};
