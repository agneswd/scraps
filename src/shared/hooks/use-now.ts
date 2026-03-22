import { useEffect, useState } from 'react';

/**
 * Returns the current Date, updating every `intervalMs` milliseconds.
 * Used to keep time-relative displays (countdowns, expiry labels) fresh
 * without requiring a page reload or navigation event.
 */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
