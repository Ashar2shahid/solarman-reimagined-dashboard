import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPower(watts: number | null | undefined): string {
  if (watts == null) return '0W';
  if (Math.abs(watts) >= 1000) return `${(watts / 1000).toFixed(2)}kW`;
  return `${Math.round(watts)}W`;
}

export function formatEnergy(kwh: number | null | undefined): string {
  if (kwh == null) return '0 kWh';
  if (Math.abs(kwh) >= 1000000) return `${(kwh / 1000000).toFixed(2)} GWh`;
  if (Math.abs(kwh) >= 1000) return `${(kwh / 1000).toFixed(2)} MWh`;
  return `${kwh.toFixed(1)} kWh`;
}

export function formatNumber(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '0';
  return n.toFixed(decimals);
}

export function timeAgo(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function unixToTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
