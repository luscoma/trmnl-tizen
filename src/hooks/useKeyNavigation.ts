import { useState, useRef, useEffect } from 'react';

export function useKeyNavigation(handler: (keyCode: number) => void) {
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandlerRef.current = (e: KeyboardEvent) => {
    handler(e.keyCode);
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { keyHandlerRef.current(e); }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}


export function useMenuNavigation(itemCount: number, handler?: (keyCode: number) => void) {
  const [focusIdx, setFocusIdx] = useState(0);
  useKeyNavigation((keyCode) => {
    switch (keyCode) {
      case 38:
        setFocusIdx(i => Math.max(0, i - 1));
        break;
      case 40: 
        setFocusIdx(i => Math.min(itemCount - 1, i + 1));
        break;
      default:
        if (handler) handler(keyCode);
        return;
    }
  });

  return { focusIdx };
}

