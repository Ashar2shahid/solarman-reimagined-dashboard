import { useState, useEffect } from 'react';

export function usePolling<T>(fetcher: () => Promise<T>, intervalMs = 10_000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const d = await fetcher();
        if (active) { setData(d); setError(null); }
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => { active = false; clearInterval(id); };
  }, [intervalMs]);

  return { data, error };
}
