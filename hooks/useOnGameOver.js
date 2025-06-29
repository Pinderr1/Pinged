import { useEffect, useRef } from 'react';

export default function useOnGameOver(gameover, callback) {
  const called = useRef(false);

  useEffect(() => {
    if (gameover && !called.current) {
      called.current = true;
      callback && callback(gameover);
    }
  }, [gameover, callback]);
}
