import React, { useMemo } from 'react';
import { Plus, Search, Trash2, PauseCircle, PlayCircle, Magnet, Zap, Network, Rocket, Activity, Layers, Monitor } from 'lucide-react';
import { useTorrentStore } from '../store/torrentStore';
import { useTauriCommands } from '../hooks/useTorrent';
import { formatBytes, formatSpeed, formatETA, getStateLabel } from '../utils/format';
import type { TorrentInfo } from '../types/torrent';

function StateBadge({ state }: { state: TorrentInfo['state'] }): React.JSX.Element {
  return (
    <span className={`state-badge ${state}`}>
      <span className="dot" />
      {getStateLabel(state)}
    </span>
  );
}

function TorrentRow({ torrent, selected, onClick }: {
  torrent: TorrentInfo;
  selected: boolean;
  onClick: () => void;
}): React.JSX.Element {
  const cmds = useTauriCommands();
  const { removeTorrent } = useTorrentStore();

  const handlePauseResume = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    try {
      if (torrent.state === 'paused') {
        await cmds.resume(torrent.id);
      } else if (torrent.state === 'downloading' || torrent.state === 'seeding') {
        await cmds.pause(torrent.id);
      }
    } catch (error) {
      console.error('Failed to toggle torrent state:', error);
    }
  };

  const handleRemove = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    try {
      const removed = await cmds.remove(torrent.id, false);
      if (removed) {
        removeTorrent(torrent.id);
      }
    } catch (error) {
      console.error('Failed to remove torrent:', error);
    }
  };

  const progressClass = torrent.progress_pct >= 100 ? 'completed'
    : torrent.state === 'paused' ? 'paused'
    : torrent.state === 'seeding' ? 'seeding'
    : 'downloading';

  return (
    <div
      className={`torrent-row state-${torrent.state} ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {/* Name + Progress */}
      <div className="torrent-info">
        <div className="torrent-name" title={torrent.name}>{torrent.name}</div>
        <div className="torrent-progress-bar">
          <div
            className={`torrent-progress-fill ${progressClass}`}
            style={{ width: `${Math.min(torrent.progress_pct, 100)}%` }}
          />
        </div>
        <div className="torrent-size-info">
          {formatBytes(torrent.downloaded)} / {formatBytes(torrent.size)} · {torrent.progress_pct.toFixed(1)}%
        </div>
      </div>

      {/* State Badge */}
      <StateBadge state={torrent.state} />

      {/* Download Speed */}
      <div className="speed-cell">
        {torrent.download_speed > 0 ? (
          <span className="speed-down">{formatSpeed(torrent.download_speed)}</span>
        ) : (
          <span className="speed-zero">—</span>
        )}
      </div>

      {/* Upload Speed */}
      <div className="speed-cell">
        {torrent.upload_speed > 0 ? (
          <span className="speed-up">{formatSpeed(torrent.upload_speed)}</span>
        ) : (
          <span className="speed-zero">—</span>
        )}
      </div>

      {/* ETA */}
      <div className="cell-mono">
        {torrent.state === 'downloading' ? formatETA(torrent.eta_secs) : '—'}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        <button
          className="btn-icon"
          onClick={handlePauseResume}
          title={torrent.state === 'paused' ? 'Resume' : 'Pause'}
          style={{ padding: '4px 5px' }}
        >
          {torrent.state === 'paused'
            ? <PlayCircle size={13} />
            : <PauseCircle size={13} />
          }
        </button>
        <button
          className="btn-icon"
          onClick={handleRemove}
          title="Remove"
          style={{ padding: '4px 5px', color: 'var(--neon-red)' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

const MemoizedTorrentRow = React.memo(TorrentRow, (prevProps, nextProps) => {
  const p = prevProps.torrent;
  const n = nextProps.torrent;
  return (
    prevProps.selected === nextProps.selected &&
    p.id === n.id &&
    p.state === n.state &&
    p.progress_pct === n.progress_pct &&
    p.download_speed === n.download_speed &&
    p.upload_speed === n.upload_speed &&
    p.eta_secs === n.eta_secs &&
    p.downloaded === n.downloaded
  );
});

export function TorrentList(): React.JSX.Element {
  const { torrents, downloadHistory, selectedId, setSelectedId, filter, searchQuery, setSearchQuery, setShowAddModal, sortBy, sortDesc } = useTorrentStore();

  const filtered = useMemo(() => {
    let list: TorrentInfo[] = [];

    if (filter === 'history') {
      list = downloadHistory.map((h) => ({
        id: h.id,
        name: h.name,
        info_hash: h.info_hash,
        size: h.size,
        save_path: h.save_path,
        downloaded: h.size,
        uploaded: h.uploaded,
        state: 'completed',
        progress_pct: 100,
        download_speed: 0,
        upload_speed: 0,
        peers: 0,
        seeds: 0,
        eta_secs: 0,
        added_at: h.completed_at,
        comment: '',
        created_by: '',
        is_private: false,
        piece_length: 0,
        num_pieces: 0,
        files: [],
        category: h.category,
      } as TorrentInfo));
    } else {
      list = [...torrents];
      if (filter !== 'all') {
        list = list.filter((t) => t.state === filter ||
          (filter === 'completed' && t.progress_pct >= 100));
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }

    // Sort by selected option
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'size':
          cmp = a.size - b.size;
          break;
        case 'progress':
          cmp = a.progress_pct - b.progress_pct;
          break;
        case 'download_speed':
          cmp = a.download_speed - b.download_speed;
          break;
        case 'upload_speed':
          cmp = a.upload_speed - b.upload_speed;
          break;
        case 'eta':
          cmp = a.eta_secs - b.eta_secs;
          break;
        case 'added_at':
        default:
          cmp = a.added_at - b.added_at;
      }
      return sortDesc ? -cmp : cmp;
    });

    return list;
  }, [torrents, downloadHistory, filter, searchQuery, sortBy, sortDesc]);

  return (
    <div className="torrent-list-pane">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={13} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search torrents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={14} />
            Add Torrent
          </button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="list-header">
        <span>Name</span>
        <span>Status</span>
        <span style={{ textAlign: 'right' }}>↓ Speed</span>
        <span style={{ textAlign: 'right' }}>↑ Speed</span>
        <span style={{ textAlign: 'right' }}>ETA</span>
        <span style={{ textAlign: 'right' }}>Actions</span>
      </div>

      {/* Torrent Items */}
      <div className="torrent-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Magnet size={52} className="empty-state-icon" color="var(--neon-cyan)" style={{ opacity: 0.2 }} />
            <h3>No Torrents</h3>
            <p style={{ marginBottom: '16px' }}>Add a torrent file or magnet link to start downloading</p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ marginBottom: '32px' }}>
              <Plus size={14} /> Add Torrent
            </button>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon"><Zap size={20} color="var(--neon-amber)" /></div>
                <div className="feature-text">
                  <h4>Lightning Fast</h4>
                  <p>Built with Rust for maximum performance and memory safety. Downloads start instantly with optimized peer selection.</p>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Network size={20} color="var(--neon-green)" /></div>
                <div className="feature-text">
                  <h4>DHT Support</h4>
                  <p>Full Distributed Hash Table support for tracker-less torrents and magnet links. No central servers are required.</p>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Rocket size={20} color="var(--neon-magenta)" /></div>
                <div className="feature-text">
                  <h4>Evolving</h4>
                  <p>Pre-release build — core features are here and improving rapidly. Expect frequent updates and refinements over time.</p>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Activity size={20} color="var(--neon-cyan)" /></div>
                <div className="feature-text">
                  <h4>Real-time Stats</h4>
                  <p>Live bandwidth graphs, peer counts, and progress tracking with a beautiful cyberpunk aesthetic.</p>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Layers size={20} color="var(--neon-amber)" /></div>
                <div className="feature-text">
                  <h4>Smart Queue</h4>
                  <p>Priority-based download queue with automatic slot management. Focus bandwidth where you need it.</p>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Monitor size={20} color="var(--text-secondary)" /></div>
                <div className="feature-text">
                  <h4>Cross Platform</h4>
                  <p>Available on Windows, macOS, and Linux (soon). Native performance on every platform.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          filtered.map((t) => (
            <MemoizedTorrentRow
              key={t.id}
              torrent={t}
              selected={selectedId === t.id}
              onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
