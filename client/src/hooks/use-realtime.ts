import { useState, useEffect } from 'react';
import { api, type RealtimeSnapshot } from '@/lib/api';

export function useRealtime(intervalMs = 10_000) {
  const [data, setData] = useState<RealtimeSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const d = await api.realtime.current();
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
