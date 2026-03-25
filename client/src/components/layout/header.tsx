import { useState } from 'react';
import { Sun, Bell, Settings, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Device', path: '/device' },
  { label: 'History', path: '/history' },
];

export function Header({ alertCount }: { alertCount: number }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-surface border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-solar" />
          <span className="text-base font-semibold text-text">Solarman</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-warm rounded-full px-1 py-1">
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

        {/* Right: icons + hamburger */}
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-surface-warm transition-colors">
            <Bell className="w-4 h-4 text-text-muted" />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>
          <button className="hidden md:block p-2 rounded-full hover:bg-surface-warm transition-colors">
            <Settings className="w-4 h-4 text-text-muted" />
          </button>
          <button
            className="md:hidden p-2 rounded-full hover:bg-surface-warm transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5 text-text" /> : <Menu className="w-5 h-5 text-text" />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="md:hidden px-4 pb-3 flex flex-col gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname === item.path
                  ? 'bg-text text-surface'
                  : 'text-text-muted hover:bg-surface-warm'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
