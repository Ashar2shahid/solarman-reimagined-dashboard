import { useState, useEffect, useRef } from 'react';
import { Sun, Bell, Settings, Menu, X, AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api, type Notification } from '@/lib/api';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Device', path: '/device' },
  { label: 'History', path: '/history' },
];

function severityIcon(severity: string) {
  switch (severity) {
    case 'critical': return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    default: return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
  }
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Header() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  // Poll unread count
  useEffect(() => {
    const fetch = () => api.notifications.unread().then(r => setUnreadCount(r.count)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 10_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when bell opens
  useEffect(() => {
    if (bellOpen) {
      api.notifications.list().then(setNotifications).catch(() => {});
    }
  }, [bellOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.notifications.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: number) => {
    await api.notifications.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

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
          {/* Notification bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative p-2 rounded-full hover:bg-surface-warm transition-colors"
            >
              <Bell className="w-4 h-4 text-text-muted" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {bellOpen && (
              <div className="absolute right-0 top-10 w-80 bg-surface rounded-xl shadow-lg border border-border z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-text">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-text-muted">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => !n.read && markRead(n.id)}
                        className={cn(
                          'w-full text-left px-4 py-3 border-b border-border/50 hover:bg-surface-warm transition-colors flex gap-3',
                          !n.read && 'bg-orange-50/50'
                        )}
                      >
                        {severityIcon(n.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn('text-xs font-medium', !n.read ? 'text-text' : 'text-text-muted')}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-text-muted shrink-0 ml-2">{timeAgo(n.timestamp)}</span>
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5 truncate">{n.message}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to="/settings" className="hidden md:block p-2 rounded-full hover:bg-surface-warm transition-colors">
            <Settings className="w-4 h-4 text-text-muted" />
          </Link>
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
