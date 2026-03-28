import React, { useState } from 'react';
import { X, Magnet, FolderOpen, Upload } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { useTorrentStore } from '../store/torrentStore';
import { useTauriCommands } from '../hooks/useTorrent';

export function AddTorrentModal(): React.JSX.Element {
  const { setShowAddModal, settings, setPreviewData, setPreviewSavePath, setPreviewFilePath, setPreviewMagnetUrl } = useTorrentStore();
  const cmds = useTauriCommands();
  const [magnetLink, setMagnetLink] = useState('');
  const [savePath, setSavePath] = useState(settings.download_path);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'magnet' | 'file'>('magnet');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (): Promise<void> => {
    if (!magnetLink.trim()) return;
    try {
      setError(null);
      const data = await cmds.parseMagnetLink(magnetLink.trim());
      setPreviewData(data);
      setPreviewSavePath(savePath);
      setPreviewFilePath(''); // No file path for magnets
      setPreviewMagnetUrl(magnetLink.trim());
      setShowAddModal(false);
    } catch (e: any) {
      console.error(e);
      setError(e.toString());
    }
  };

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault();
    setIsDragOver(false);
    
    setError(null);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.torrent'));
    if (files.length > 0) {
      const file = files[0] as File & { path?: string };
      if (file.path) {
        try {
          const data = await cmds.parseTorrentFile(file.path);
          setPreviewData(data);
          setPreviewSavePath(savePath);
          setPreviewFilePath(file.path);
          setPreviewMagnetUrl('');
          setShowAddModal(false);
        } catch (err: any) {
          console.error(err);
          setError(err.toString());
        }
      } else {
        setError('Cannot access file path. Use browser button instead.');
      }
    }
  };

  const handleBrowse = async () => {
    try {
      setError(null);
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Torrent Files', extensions: ['torrent'] }]
      });
      if (!selected) return;
      
      const filePath = selected as string;
      const data = await cmds.parseTorrentFile(filePath);
      setPreviewData(data);
      setPreviewSavePath(savePath);
      setPreviewFilePath(filePath);
      setPreviewMagnetUrl('');
      setShowAddModal(false);
    } catch (err: any) {
      console.error("Browse error: ", err);
      setError(err.toString());
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

          {error && (
            <div style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: 4,
              color: '#ff4444',
              fontSize: 12,
              fontFamily: 'var(--font-mono)'
            }}>
              ERROR: {error}
            </div>
          )}

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
