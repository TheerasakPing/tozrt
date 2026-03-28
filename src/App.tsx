import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TorrentList } from './components/TorrentList';
import { DetailPanel } from './components/DetailPanel';
import { AddTorrentModal } from './components/AddTorrentModal';
import { TorrentPreviewModal } from './components/TorrentPreviewModal';
import { SettingsPage } from './components/SettingsPage';
import { useTorrentStore } from './store/torrentStore';
import { useTorrentEvents } from './hooks/useTorrent';
import { formatSpeed } from './utils/format';

const ACCENT_COLORS = {
  cyan: '#00f5ff',
  magenta: '#ff00a0',
  green: '#39ff14',
} as const;

const STATUS_BAR_ICON_MARGIN = 3;

function StatusBar(): React.JSX.Element {
  // Use granular selectors so we only re-render the StatusBar when strictly necessary
  const dhtNodes = useTorrentStore((s) => s.stats.dht_nodes);
  const dlSpeed = useTorrentStore((s) => s.stats.download_speed);
  const upSpeed = useTorrentStore((s) => s.stats.upload_speed);
  const totalTorrents = useTorrentStore((s) => s.torrents.length);

  return (
    <div className="status-bar">
      <span className="status-item">
        <span style={{ color: 'var(--neon-green)', marginRight: STATUS_BAR_ICON_MARGIN }}>●</span> DHT: {dhtNodes} nodes
      </span>
      <span className="status-item">
        ↓ {formatSpeed(dlSpeed)}
      </span>
      <span className="status-item">
        ↑ {formatSpeed(upSpeed)}
      </span>
      <span className="status-item">
        Total: {totalTorrents} torrents
      </span>
      <span className="status-item" style={{ marginLeft: 'auto' }}>
        NexTorrent v1.0.0
      </span>
    </div>
  );
}

function App(): React.JSX.Element {
  const initSettings = useTorrentStore((s) => s.initSettings);
  useEffect(() => {
    initSettings();
  }, [initSettings]);

  useTorrentEvents();

  const accentColor = useTorrentStore((s) => s.settings.accent_color);
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--neon-cyan',
      ACCENT_COLORS[accentColor || 'cyan']
    );
    document.documentElement.style.setProperty(
      '--neon-cyan-dim',
      `${ACCENT_COLORS[accentColor || 'cyan']}26`
    );
    document.documentElement.style.setProperty(
      '--neon-cyan-mid',
      `${ACCENT_COLORS[accentColor || 'cyan']}66`
    );
  }, [accentColor]);

  const showAddModal = useTorrentStore((s) => s.showAddModal);
  const showSettings = useTorrentStore((s) => s.showSettings);
  const selectedId = useTorrentStore((s) => s.selectedId);
  const theme = useTorrentStore((s) => s.settings.theme);

  return (
    <div className="app-layout" data-theme={theme || 'dark'}>
      <Header />

      <div className="app-body">
        {showSettings ? (
          <>
            <Sidebar />
            <SettingsPage />
          </>
        ) : (
          <>
            <Sidebar />
            <div className="main-content">
              <TorrentList />
              {selectedId !== null && <DetailPanel />}
            </div>
          </>
        )}
      </div>

      <StatusBar />

      {showAddModal && <AddTorrentModal />}
      <TorrentPreviewModal />
    </div>
  );
}

export default App;
