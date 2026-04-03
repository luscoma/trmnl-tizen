import { useEffect, useRef } from 'react';

export default function useTimeout(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (delayMs === null) return;
    const id = setTimeout(() => savedCallback.current(), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);
}
