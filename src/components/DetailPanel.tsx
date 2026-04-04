import React, { useState, useEffect } from 'react';
import { X, FileText, Users, Radio, Info, FolderOpen, File } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useTorrentStore } from '../store/torrentStore';
import { useTauriCommands } from '../hooks/useTorrent';
import { formatBytes, formatSpeed, formatDate, formatETA } from '../utils/format';
import type { PeerInfo, TrackerInfo, TorrentFile } from '../types/torrent';

type Tab = 'info' | 'files' | 'peers' | 'trackers';

function splitPathSegments(path: string): string[] {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);
}

function joinPath(basePath: string, relativePath?: string): string {
  if (!relativePath) return basePath;
  const normalizedBase = basePath.replace(/[\\/]+$/, '');
  const normalizedRelative = relativePath.replace(/^[/\\]+/, '');
  return `${normalizedBase}/${normalizedRelative}`;
}

function getCommonFileFolder(torrent: ReturnType<typeof useTorrentStore.getState>['torrents'][0]): string {
  if (!torrent.files.length) {
    return torrent.save_path;
  }

  const folderSegments = torrent.files
    .map((file) => splitPathSegments(file.path))
    .map((segments) => segments.slice(0, -1));

  if (!folderSegments.length) {
    return torrent.save_path;
  }

  let commonSegments = [...folderSegments[0]];
  for (const segments of folderSegments.slice(1)) {
    let matchCount = 0;
    while (matchCount < commonSegments.length && matchCount < segments.length && commonSegments[matchCount] === segments[matchCount]) {
      matchCount += 1;
    }
    commonSegments = commonSegments.slice(0, matchCount);
    if (!commonSegments.length) {
      break;
    }
  }

  return commonSegments.length ? joinPath(torrent.save_path, commonSegments.join('/')) : torrent.save_path;
}

function FilesTab({ files, torrentId }: { files: TorrentFile[]; torrentId: number }) {
  return (
    <div>
      {files.map((file) => (
        <div key={`${torrentId}-${file.id}`} className="file-item">
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

  const folderPath = getCommonFileFolder(torrent);

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
            onClick={() => {
              open(folderPath || torrent.save_path)
                .catch((error) => {
                  const errorMsg = error instanceof Error ? error.message : String(error);
                  console.error('Failed to open save folder:', error);
                  
                  if (errorMsg.includes('Not allowed') || errorMsg.includes('permission') || errorMsg.includes('access')) {
                    alert(`Cannot access download location:\n${folderPath || torrent.save_path}\n\nThis may be because:\n• The drive/volume is not connected\n• macOS doesn't have permission to access this location\n\nPlease check if the drive is connected and try again.`);
                  } else if (errorMsg.includes('No such file') || errorMsg.includes('not exist')) {
                    alert(`Download location not found:\n${folderPath || torrent.save_path}\n\nThe folder may have been moved or deleted.`);
                  } else {
                    alert(`Failed to open location: ${errorMsg}`);
                  }
                });
            }}
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
                const filePath = joinPath(torrent.save_path, firstFile?.path || firstFile?.name || '');
                open(filePath)
                  .catch((error) => {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    console.error('Failed to open file:', error);
                    
                    if (errorMsg.includes('Not allowed') || errorMsg.includes('permission') || errorMsg.includes('access')) {
                      alert(`Cannot access file:\n${filePath}\n\nThis may be because:\n• The drive/volume is not connected\n• macOS doesn't have permission to access this location`);
                    } else if (errorMsg.includes('No such file') || errorMsg.includes('not exist')) {
                      alert(`File not found:\n${filePath}\n\nThe file may have been moved or deleted.`);
                    } else {
                      alert(`Failed to open file: ${errorMsg}`);
                    }
                  });
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
        {activeTab === 'files' && <FilesTab files={torrent.files} torrentId={torrent.id} />}
        {activeTab === 'peers' && <PeersTab torrentId={torrent.id} />}
        {activeTab === 'trackers' && <TrackersTab torrentId={torrent.id} />}
      </div>
    </div>
  );
}
