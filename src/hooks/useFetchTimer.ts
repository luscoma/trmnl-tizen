import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '../api';
import useInterval from './useInterval';
import useTimeout from './useTimeout';

// Drives the countdown display and schedules the next refresh.
// Pass nextFetch (ms timestamp) to start; null to pause.
// Returns the formatted countdown string.
export function useFetchTimer(nextFetch: number | null, onExpire: () => void): string {
  const [countdown, setCountdown] = useState<string | null>(null);
  const [delay, setDelay]         = useState<number | null>(null);

  useEffect(() => {
    if (nextFetch === null) {
      setCountdown(null);
      setDelay(null);
      return;
    }
    setCountdown(formatTimeRemaining(nextFetch));
    setDelay(Math.max(0, nextFetch - Date.now()));
  }, [nextFetch]);

  useInterval(() => setCountdown(formatTimeRemaining(nextFetch)), countdown !== null ? 1000 : null);
  useTimeout(onExpire, delay);

  return countdown ?? '--:--';
}
