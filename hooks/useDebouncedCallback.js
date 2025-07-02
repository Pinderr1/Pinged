import { useCallback, useEffect, useRef, useState } from 'react';

export default function useDebouncedCallback(fn, delay = 500) {
  const [waiting, setWaiting] = useState(false);
  const timeoutRef = useRef(null);

  const callback = useCallback(
    async (...args) => {
      if (waiting) return;
      setWaiting(true);
      try {
        await fn(...args);
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setWaiting(false);
          timeoutRef.current = null;
        }, delay);
      }
    },
    [fn, delay, waiting]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [callback, waiting];
}
