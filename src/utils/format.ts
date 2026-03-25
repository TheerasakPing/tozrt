import { TorrentState } from '../types/torrent';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return '—';
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatETA(secs: number): string {
  if (secs <= 0) return '—';
  if (secs >= 86400) return `${Math.floor(secs / 86400)}d`;
  if (secs >= 3600) return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
  if (secs >= 60) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${secs}s`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getStateLabel(state: TorrentState): string {
  const labels: Record<TorrentState, string> = {
    downloading: 'Downloading',
    seeding: 'Seeding',
    paused: 'Paused',
    checking: 'Checking',
    error: 'Error',
    queued: 'Queued',
    completed: 'Done',
  };
  return labels[state] || state;
}

export function getStateClass(state: TorrentState): string {
  return state;
}
