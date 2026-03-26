import { Cloud, Sun, CloudRain, CloudSnow } from 'lucide-react';
import type { WeatherDay } from '@/lib/api';

interface WeatherCardProps {
  weather: WeatherDay[];
}

function weatherIcon(pic: string | null) {
  switch (pic) {
    case 'sunny': return <Sun className="w-5 h-5 text-solar" />;
    case 'rainy-s': case 'rainy': return <CloudRain className="w-5 h-5 text-grid" />;
    case 'snowy': return <CloudSnow className="w-5 h-5 text-grid" />;
    default: return <Cloud className="w-5 h-5 text-text-muted" />;
  }
}

export function WeatherCard({ weather }: WeatherCardProps) {
  if (!weather.length) return null;

  const today = weather[0];
  const forecast = weather.slice(1, 5);

  return (
    <div className="bg-surface rounded-2xl p-5 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-text mb-3">{today.regionName ?? 'Weather'}</h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-surface-warm flex items-center justify-center">
          {weatherIcon(today.weatherPic)}
        </div>
        <div>
          <div className="text-2xl font-bold">{today.temp ?? '—'}°C</div>
          <div className="text-xs text-text-muted">{today.weatherCode} · {today.tempMin}°/{today.tempMax}°</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-auto">
        {forecast.map(day => (
          <div key={day.date} className="text-center">
            <div className="text-[10px] text-text-muted">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</div>
            <div className="flex justify-center my-1">{weatherIcon(day.weatherPic)}</div>
            <div className="text-[10px] font-medium">{day.tempMax}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
