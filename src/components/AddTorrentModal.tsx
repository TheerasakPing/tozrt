import React, { useState } from 'react';
import { X, Magnet, FolderOpen, Upload } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { useTorrentStore } from '../store/torrentStore';
import { useTauriCommands } from '../hooks/useTorrent';

export function AddTorrentModal(): React.JSX.Element {
  const { setShowAddModal, settings } = useTorrentStore();
  const cmds = useTauriCommands();
  const [magnetLink, setMagnetLink] = useState('');
  const [savePath, setSavePath] = useState(settings.download_path);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'magnet' | 'file'>('magnet');

  const handleAdd = async (): Promise<void> => {
    if (!magnetLink.trim()) return;
    try {
      await cmds.addMagnet(magnetLink.trim(), savePath);
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault();
    setIsDragOver(false);
    // Note: Tauri's custom file drop usually intercepts web drag events at the window level.
    // This allows fallback if configured for standard DOM API. We will mainly rely on browse dialogue.
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.torrent'));
    for (const file of files) {
      const f = file as File & { path?: string };
      if (f.path) { // .path is often injected by Electron/Tauri depending on bindings
        await cmds.addTorrentFile(f.path, savePath);
      }
    }
    if (files.length > 0) setShowAddModal(false);
  };

  const handleBrowse = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Torrent Files', extensions: ['torrent'] }]
      });
      if (!selected) return;
      const filePaths = Array.isArray(selected) ? selected : [selected];
      
      for (const filePath of filePaths) {
        await cmds.addTorrentFile(filePath, savePath);
      }
      setShowAddModal(false);
    } catch (err) {
      console.error("Browse error: ", err);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add Torrent</span>
          <button className="btn-icon" onClick={() => setShowAddModal(false)}>
            <X size={14} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
          {(['magnet', 'file'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === t ? '2px solid var(--neon-cyan)' : '2px solid transparent',
                color: activeTab === t ? 'var(--neon-cyan)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t === 'magnet' ? '🧲 Magnet Link' : '📁 Torrent File'}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {activeTab === 'magnet' ? (
            <>
              <div className="form-group">
                <label className="form-label">Magnet Link</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="magnet:?xt=urn:btih:..."
                  value={magnetLink}
                  onChange={(e) => setMagnetLink(e.target.value)}
                  autoFocus
                />
              </div>
            </>
          ) : (
            <div
              className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={handleBrowse}
            >
              <Upload size={32} color="var(--neon-cyan)" style={{ margin: '0 auto', opacity: 0.6 }} />
              <div className="drop-zone-text">Click to traverse filesystem or drop .torrent here</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <FolderOpen size={11} style={{ display: 'inline', marginRight: 4 }} />
              Save To
            </label>
            <input
              className="form-input"
              type="text"
              value={savePath}
              onChange={(e) => setSavePath(e.target.value)}
            />
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
          {activeTab === 'magnet' && (
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={!magnetLink.trim()}
              style={{ opacity: magnetLink.trim() ? 1 : 0.5 }}
            >
              <Magnet size={14} />
              Start Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
