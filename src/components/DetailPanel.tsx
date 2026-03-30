import React, { useState, useEffect } from 'react';
import { X, FileText, Users, Radio, Info, FolderOpen, File } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useTorrentStore } from '../store/torrentStore';
import { useTauriCommands } from '../hooks/useTorrent';
import { formatBytes, formatSpeed, formatDate, formatETA } from '../utils/format';
import type { PeerInfo, TrackerInfo, TorrentFile } from '../types/torrent';

type Tab = 'info' | 'files' | 'peers' | 'trackers';

function FilesTab({ files }: { files: TorrentFile[] }) {
  return (
    <div>
      {files.map((file) => (
        <div key={file.id} className="file-item">
          <FileText size={13} color="var(--neon-cyan)" style={{ flexShrink: 0 }} />
          <span className="file-name" title={file.name}>{file.name}</span>
          <div className="file-progress">
            <div
              className="file-progress-fill"
              style={{ width: `${file.size > 0 ? (file.downloaded / file.size) * 100 : 0}%` }}
            />
          </div>
          <span className="file-size">{formatBytes(file.size)}</span>
        </div>
      ))}
    </div>
  );
}

function PeersTab({ torrentId }: { torrentId: number }) {
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const cmds = useTauriCommands();

  useEffect(() => {
    cmds.getPeers(torrentId).then((p) => setPeers(p as PeerInfo[]));
    const interval = setInterval(() => {
      cmds.getPeers(torrentId).then((p) => setPeers(p as PeerInfo[]));
    }, 3000);
    return () => clearInterval(interval);
  }, [torrentId]);

  return (
    <table className="peer-table">
      <thead>
        <tr>
          <th>IP</th>
          <th>Client</th>
          <th>↓</th>
          <th>↑</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        {peers.map((peer, i) => (
          <tr key={i}>
            <td>{peer.ip}</td>
            <td style={{ color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {peer.client}
            </td>
            <td style={{ color: 'var(--neon-cyan)' }}>{formatSpeed(peer.download_speed)}</td>
            <td style={{ color: 'var(--neon-magenta)' }}>{formatSpeed(peer.upload_speed)}</td>
            <td>{peer.progress.toFixed(0)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TrackersTab({ torrentId }: { torrentId: number }) {
  const [trackers, setTrackers] = useState<TrackerInfo[]>([]);
  const cmds = useTauriCommands();

  useEffect(() => {
    cmds.getTrackers(torrentId).then((t) => setTrackers(t as TrackerInfo[]));
    const interval = setInterval(() => {
      cmds.getTrackers(torrentId).then((t) => setTrackers(t as TrackerInfo[]));
    }, 5000);
    return () => clearInterval(interval);
  }, [torrentId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {trackers.map((tracker, i) => (
        <div key={i} style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', marginBottom: 6, wordBreak: 'break-all' }}>
            {tracker.url}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            <span style={{
              color: ['Working', 'Active'].includes(tracker.status)
                ? 'var(--neon-green)'
                : tracker.status === 'Error'
                  ? 'var(--neon-red)'
                  : 'var(--text-muted)'
            }}>
              ● {tracker.status}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Peers: <span style={{ color: 'var(--text-secondary)' }}>{tracker.peers}</span></span>
            <span style={{ color: 'var(--text-muted)' }}>Seeds: <span style={{ color: 'var(--text-secondary)' }}>{tracker.seeds}</span></span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoTab({ torrent }: { torrent: ReturnType<typeof useTorrentStore.getState>['torrents'][0] }) {
  const showPrivateHint = torrent.is_private && torrent.progress_pct === 0 && torrent.peers === 0;
  const stats = [
    { label: 'Size', value: formatBytes(torrent.size) },
    { label: 'Downloaded', value: formatBytes(torrent.downloaded) },
    { label: 'Uploaded', value: formatBytes(torrent.uploaded) },
    { label: 'Peers', value: `${torrent.peers} peers · ${torrent.seeds} seeds` },
    { label: 'Pieces', value: `${torrent.num_pieces} × ${formatBytes(torrent.piece_length)}` },
    { label: 'Privacy', value: torrent.is_private ? 'Private tracker' : 'Public torrent' },
    { label: 'Added', value: formatDate(torrent.added_at) },
    { label: 'Save Path', value: torrent.save_path || 'Unavailable' },
    { label: 'Info Hash', value: torrent.info_hash },
  ];

  return (
    <div>
      <div className="detail-stats">
        <div className="detail-stat-card">
          <div className="detail-stat-label">Progress</div>
          <div className="detail-stat-value" style={{ color: 'var(--neon-cyan)' }}>
            {torrent.progress_pct.toFixed(2)}%
          </div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-label">ETA</div>
          <div className="detail-stat-value">
            {formatETA(torrent.eta_secs)}
          </div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-label">↓ Speed</div>
          <div className="detail-stat-value" style={{ color: 'var(--neon-cyan)' }}>
            {formatSpeed(torrent.download_speed)}
          </div>
        </div>
        <div className="detail-stat-card">
          <div className="detail-stat-label">↑ Speed</div>
          <div className="detail-stat-value" style={{ color: 'var(--neon-magenta)' }}>
            {formatSpeed(torrent.upload_speed)}
          </div>
        </div>
      </div>

      {showPrivateHint && (
        <div style={{
          marginBottom: 12,
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(0, 245, 255, 0.18)',
          background: 'rgba(0, 245, 255, 0.06)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          lineHeight: 1.5,
        }}>
          This torrent is private, so peer discovery depends on its trackers only. If it stays at 0 peers, the tracker has not returned reachable peers yet.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{
            display: 'flex',
            gap: 8,
            padding: '6px 0',
            borderBottom: '1px solid rgba(0,245,255,0.04)',
            fontSize: 12,
          }}>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 90, fontSize: 11, flexShrink: 0 }}>
              {label}
            </span>
            <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all', fontFamily: label === 'Info Hash' ? 'var(--font-mono)' : 'inherit' }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { Category } from '../types/torrent';

const categoryOptions: { id: Category; label: string }[] = [
  { id: 'uncategorized', label: 'Uncategorized' },
  { id: 'movies', label: 'Movies' },
  { id: 'music', label: 'Music' },
  { id: 'games', label: 'Games' },
  { id: 'software', label: 'Software' },
  { id: 'documents', label: 'Documents' },
  { id: 'images', label: 'Images' },
  { id: 'videos', label: 'Videos' },
  { id: 'other', label: 'Other' },
];

export function DetailPanel() {
  const { torrents, selectedId, setSelectedId, categories, setCategory } = useTorrentStore();
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const torrent = torrents.find((t) => t.id === selectedId);

  if (!torrent) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: 'Info', icon: <Info size={12} /> },
    { id: 'files', label: 'Files', icon: <FileText size={12} /> },
    { id: 'peers', label: 'Peers', icon: <Users size={12} /> },
    { id: 'trackers', label: 'Trackers', icon: <Radio size={12} /> },
  ];

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div className="detail-name" title={torrent.name}>{torrent.name}</div>
          <button
            className="btn-icon"
            onClick={() => setSelectedId(null)}
            style={{ padding: '2px 4px', flexShrink: 0 }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Mini progress bar */}
        <div className="torrent-progress-bar" style={{ height: 3 }}>
          <div
            className={`torrent-progress-fill ${torrent.state === 'seeding' ? 'seeding' : torrent.state === 'paused' ? 'paused' : 'downloading'}`}
            style={{ width: `${Math.min(torrent.progress_pct, 100)}%` }}
          />
        </div>
      </div>

      <div className="detail-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          <select
            value={categories[torrent.id] || 'uncategorized'}
            onChange={(e) => setCategory(torrent.id, e.target.value as Category)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              padding: '2px 6px',
              fontSize: 10,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <button
            className="btn-icon"
            onClick={() => open(torrent.save_path).catch(() => {})}
            title="Open Save Folder"
            style={{ padding: 4 }}
          >
            <FolderOpen size={12} />
          </button>
          {torrent.files[0] && (
            <button
              className="btn-icon"
              onClick={() => {
                const firstFile = torrent.files[0];
                const filePath = `${torrent.save_path}/${firstFile?.path || firstFile?.name || ''}`;
                open(filePath).catch(() => {});
              }}
              title="Open File"
              style={{ padding: 4 }}
            >
              <File size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="detail-content">
        {activeTab === 'info' && <InfoTab torrent={torrent} />}
        {activeTab === 'files' && <FilesTab files={torrent.files} />}
        {activeTab === 'peers' && <PeersTab torrentId={torrent.id} />}
        {activeTab === 'trackers' && <TrackersTab torrentId={torrent.id} />}
      </div>
    </div>
  );
}
