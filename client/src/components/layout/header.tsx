import { Sun, Bell, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Device', path: '/device' },
  { label: 'History', path: '/history' },
];

export function Header({ alertCount }: { alertCount: number }) {
  const location = useLocation();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border">
      <div className="flex items-center gap-3">
        <Sun className="w-6 h-6 text-solar" />
        <span className="text-lg font-semibold text-text">Solarman</span>
      </div>

      <nav className="flex items-center gap-1 bg-surface-warm rounded-full px-1 py-1">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              location.pathname === item.path
                ? 'bg-text text-surface'
                : 'text-text-muted hover:text-text'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-full hover:bg-surface-warm transition-colors">
          <Bell className="w-5 h-5 text-text-muted" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>
        <button className="p-2 rounded-full hover:bg-surface-warm transition-colors">
          <Settings className="w-5 h-5 text-text-muted" />
        </button>
      </div>
    </header>
  );
}
