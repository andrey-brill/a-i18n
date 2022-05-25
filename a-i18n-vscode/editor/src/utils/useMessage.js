
import { useEffect } from 'react';


export default function useMessage(callback) {

  useEffect(() => {

    const listener = (event) => {
      callback(event.data || {});
    }

    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    };

  }, []);

}