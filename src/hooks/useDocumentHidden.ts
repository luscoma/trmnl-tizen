import { useState, useEffect } from 'react';

export function useDocumentHidden(): boolean {
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    function onVisibility() { setHidden(document.hidden); }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  return hidden;
}
