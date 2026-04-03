import { useState, useRef, useCallback } from 'react';

export function useAutoHide(delayMs: number) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), delayMs);
  }, [delayMs]);

  const hide = useCallback(() => {
    setVisible(false);
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  }, []);

  return { visible, show, hide };
}
