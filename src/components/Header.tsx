import React from 'react';
import { Download, Upload, Wifi, Activity, Moon, Sun, Search } from 'lucide-react';
import { useTorrentStore } from '../store/torrentStore';
import { formatSpeed, formatBytes } from '../utils/format';
import type { SortOption } from '../types/torrent';

import logo from '../assets/logo.png';

const HEADER_ICON_SIZE = 12;
const HEADER_FONT_SIZE = 11;

export function Header(): React.JSX.Element {
  // Use granular selectors to avoid whole-tree array re-renders
  const downloadSpeed = useTorrentStore((s) => s.stats.download_speed);
  const uploadSpeed = useTorrentStore((s) => s.stats.upload_speed);
  const dhtNodes = useTorrentStore((s) => s.stats.dht_nodes);
  const activeTorrents = useTorrentStore((s) => s.stats.active_torrents);
  const freeDiskSpace = useTorrentStore((s) => s.stats.free_disk_space);
  
  const theme = useTorrentStore((s) => s.settings.theme);
  const updateSettings = useTorrentStore((s) => s.updateSettings);
  const searchQuery = useTorrentStore((s) => s.searchQuery);
  const setSearchQuery = useTorrentStore((s) => s.setSearchQuery);
  const sortBy = useTorrentStore((s) => s.sortBy);
  const setSortBy = useTorrentStore((s) => s.setSortBy);

  const toggleTheme = () => {
    updateSettings({ theme: theme === 'light' ? 'dark' : 'light' });
  };

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'added_at', label: 'Date Added' },
    { id: 'name', label: 'Name' },
    { id: 'size', label: 'Size' },
    { id: 'progress', label: 'Progress' },
    { id: 'download_speed', label: 'Download Speed' },
  ];

  return (
    <header className="app-header">
      {/* Logo */}
      <div className="logo">
        <img src={logo} className="logo-icon" alt="NexTorrent" />
        <span className="logo-text">NEXTORRENT</span>
      </div>

      <div className="header-divider" />

      {/* Live Stats */}
      <div className="header-stats">
        <div className="header-stat">
          <Download size={HEADER_ICON_SIZE} color="var(--neon-cyan)" />
          <span className="stat-label">DL</span>
          <span className="stat-value down">{formatSpeed(downloadSpeed)}</span>
        </div>
        <div className="header-stat">
          <Upload size={HEADER_ICON_SIZE} color="var(--neon-magenta)" />
          <span className="stat-label">UL</span>
          <span className="stat-value up">{formatSpeed(uploadSpeed)}</span>
        </div>
        <div className="header-stat">
          <Wifi size={HEADER_ICON_SIZE} color="var(--neon-green)" />
          <span className="stat-label">DHT</span>
          <span className="stat-value dht">{dhtNodes.toLocaleString()}</span>
        </div>
        <div className="header-stat">
          <Activity size={HEADER_ICON_SIZE} color="var(--text-muted)" />
          <span className="stat-label">Active</span>
          <span className="stat-value">{activeTorrents}</span>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search torrents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 8px 4px 28px',
              fontSize: 11,
              color: 'var(--text-primary)',
              width: 180,
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 8px',
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
          }}
        >
          {sortOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Free space and Theme Toggle */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: HEADER_FONT_SIZE, color: 'var(--text-muted)' }}>
        <span>Free: <span style={{ color: 'var(--text-secondary)' }}>{formatBytes(freeDiskSpace)}</span></span>
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '4px',
          }}
          className="hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
}
