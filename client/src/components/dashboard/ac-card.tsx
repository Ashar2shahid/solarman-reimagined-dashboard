import { useState, useEffect } from 'react';
import { api, type ACState } from '@/lib/api';
import { Power, Minus, Plus, Snowflake } from 'lucide-react';

export function ACCard() {
  const [state, setState] = useState<ACState>({ power: false, temp: 24, mode: 0, fan: 0 });
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api.ac.state().then(setState).catch(() => {});
  }, []);

  const send = async (action: string, fn: () => Promise<{ ok: boolean; state: ACState }>) => {
    setLoading(action);
    try {
      const res = await fn();
      if (res.ok) setState(res.state);
    } catch (e) {
      console.error('AC command failed:', e);
    }
    setLoading(null);
  };

  return (
    <div className="bg-surface rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Snowflake className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-text-muted">AC Control</span>
        </div>
        <button
          onClick={() => send('power', () => api.ac.power(!state.power))}
          disabled={!!loading}
          className={`p-2 rounded-full transition-colors ${
            state.power
              ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
              : 'bg-surface-warm text-text-muted hover:bg-border'
          }`}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>

      {!state.power ? (
        <div className="text-center py-3 text-text-muted text-sm">Off</div>
      ) : (
        <div className="flex items-center justify-between">
          <button
            onClick={() => send('temp', () => api.ac.temp(state.temp - 1))}
            disabled={state.temp <= 16 || !!loading}
            className="w-10 h-10 rounded-xl bg-surface-warm flex items-center justify-center hover:bg-border transition-colors disabled:opacity-30"
          >
            <Minus className="w-4 h-4 text-text" />
          </button>
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-3xl font-bold text-text">{state.temp}</span>
              <span className="text-lg text-text-muted">°C</span>
            </div>
            <span className="text-xs text-blue-500">Cool · Auto</span>
          </div>
          <button
            onClick={() => send('temp', () => api.ac.temp(state.temp + 1))}
            disabled={state.temp >= 30 || !!loading}
            className="w-10 h-10 rounded-xl bg-surface-warm flex items-center justify-center hover:bg-border transition-colors disabled:opacity-30"
          >
            <Plus className="w-4 h-4 text-text" />
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center text-[10px] text-text-muted mt-2">Sending IR...</div>
      )}
    </div>
  );
}
