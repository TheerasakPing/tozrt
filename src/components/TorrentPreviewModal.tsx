import React, { useState } from 'react';
import { X, HardDrive, FileText, CheckCircle2, ChevronRight, Info, Globe, Shield, FolderOpen } from 'lucide-react';
import { open, message } from '@tauri-apps/plugin-dialog';
import { useTorrentStore } from '../store/torrentStore';
import { useTauriCommands } from '../hooks/useTorrent';
import { formatBytes } from '../utils/format';

export function TorrentPreviewModal(): React.JSX.Element | null {
  const { 
    previewData, 
    previewSavePath, 
    previewFilePath,
    previewMagnetUrl,
    clearPreview,
    setPreviewSavePath,
    torrents,
    settings
  } = useTorrentStore();
  
  const cmds = useTauriCommands();
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite' | null>(null);

  // Duplicate Check Validation
  const isDuplicate = Boolean(
    settings.check_duplicates && 
    previewData && 
    torrents.some(t => t.info_hash === previewData.info_hash)
  );

  // Initialize all files as selected if previewData exists
  React.useEffect(() => {
    if (previewData) {
      setSelectedFiles(new Set(previewData.files.map(f => f.index)));
    }
  }, [previewData]);

  if (!previewData) return null;

  const handleClose = () => {
    clearPreview();
  };

  const handleConfirm = async () => {
    // If duplicate and no action chosen, ask user first
    if (isDuplicate && !duplicateAction) {
      // User needs to select action via the buttons below
      return;
    }

    try {
      setIsAdding(true);
      const selectedIndices = previewData.source === 'magnet' && previewData.files.length === 0
        ? []
        : Array.from(selectedFiles);
      if (previewData.source === 'magnet') {
        await cmds.startTorrent('magnet', previewMagnetUrl, previewSavePath, selectedIndices);
      } else if (previewFilePath) {
        await cmds.startTorrent('file', previewFilePath, previewSavePath, selectedIndices);
      }
      clearPreview();
      setDuplicateAction(null);
    } catch (err) {
      console.error('Failed to add torrent:', err);
      // Show error dialog
      await message(err instanceof Error ? err.message : String(err), {
        title: 'ไม่สามารถเริ่มดาวน์โหลดได้',
        kind: 'error',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleBrowseSavePath = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: previewSavePath
    });
    if (selected && typeof selected === 'string') {
      setPreviewSavePath(selected);
    }
  };

  const toggleFile = (index: number) => {
    const next = new Set(selectedFiles);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedFiles(next);
  };

  const toggleAll = () => {
    if (selectedFiles.size === previewData.files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(previewData.files.map(f => f.index)));
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal preview-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, width: '90%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="status-dot pulsing" style={{ backgroundColor: 'var(--neon-cyan)' }} />
            <span className="modal-title">Torrent Preview</span>
          </div>
          <button className="btn-icon" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body preview-content">
          {/* Duplicate Warning Alert with Action Buttons */}
          {isDuplicate && (
            <div className="alert alert-warning" style={{ 
              marginBottom: 16, 
              display: 'flex', 
              flexDirection: 'column',
              gap: 12, 
              padding: '12px 16px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--neon-magenta)', 
              border: '1px solid var(--neon-magenta)', 
              borderRadius: 'var(--radius-md)' 
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Shield size={16} />
                <span><strong>Duplicate Detected:</strong> This torrent is already in your download list.</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 24 }}>
                <button
                  className="btn btn-sm"
                  onClick={() => setDuplicateAction('skip')}
                  style={{
                    background: duplicateAction === 'skip' ? 'var(--neon-cyan)' : 'rgba(0, 245, 255, 0.2)',
                    color: duplicateAction === 'skip' ? 'var(--bg-void)' : 'var(--neon-cyan)',
                    border: '1px solid var(--neon-cyan)',
                    padding: '6px 12px',
                    fontSize: '12px'
                  }}
                >
                  Skip Adding
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => setDuplicateAction('overwrite')}
                  style={{
                    background: duplicateAction === 'overwrite' ? 'var(--neon-green)' : 'rgba(57, 255, 20, 0.2)',
                    color: duplicateAction === 'overwrite' ? 'var(--bg-void)' : 'var(--neon-green)',
                    border: '1px solid var(--neon-green)',
                    padding: '6px 12px',
                    fontSize: '12px'
                  }}
                >
                  Force Download Again
                </button>
              </div>
            </div>
          )}

          {/* Main Info Card */}
          <div className="preview-info-card">
            <div className="name-area">
              <div className="name-main">{previewData.name}</div>
              <div className="info-hash">HASH: {previewData.info_hash}</div>
            </div>
            
            <div className="metadata-grid">
              <div className="meta-item">
                <HardDrive size={14} className="meta-icon" />
                <div className="meta-label">Total Size</div>
                <div className="meta-value">{formatBytes(previewData.total_size)}</div>
              </div>
              <div className="meta-item">
                <FileText size={14} className="meta-icon" />
                <div className="meta-label">Files</div>
                <div className="meta-value">{previewData.files.length} items</div>
              </div>
              <div className="meta-item">
                <Info size={14} className="meta-icon" />
                <div className="meta-label">Pieces</div>
                <div className="meta-value">{previewData.num_pieces} x {formatBytes(previewData.piece_length)}</div>
              </div>
              <div className="meta-item">
                <Shield size={14} className="meta-icon" />
                <div className="meta-label">Privacy</div>
                <div className="meta-value">{previewData.is_private ? 'PRIVATE' : 'PUBLIC'}</div>
              </div>
            </div>
          </div>

          {/* Save Path Selector */}
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">
              <FolderOpen size={12} style={{ display: 'inline', marginRight: 6 }} />
              Download Destination
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                className="form-input" 
                value={previewSavePath} 
                onChange={(e) => setPreviewSavePath(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-ghost" onClick={handleBrowseSavePath}>Browse</button>
            </div>
          </div>

          {/* File Selection */}
          <div className="file-preview-section">
            <div className="section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ChevronRight size={14} />
                <span>Files to Download ({selectedFiles.size})</span>
              </div>
              <button className="btn-text" onClick={toggleAll}>
                {selectedFiles.size === previewData.files.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="file-list-container scrollbar">
              {previewData.files.map((file) => (
                <div 
                  key={file.index} 
                  className={`file-item-preview ${selectedFiles.has(file.index) ? 'selected' : ''}`}
                  onClick={() => toggleFile(file.index)}
                >
                  <div className="checkbox">
                    {selectedFiles.has(file.index) && <CheckCircle2 size={12} />}
                  </div>
                  <div className="file-info-row">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatBytes(file.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trackers */}
          {previewData.trackers.length > 0 && (
            <div className="trackers-preview-section">
              <div className="section-header">
                <Globe size={14} />
                <span>Trackers ({previewData.trackers.length})</span>
              </div>
              <div className="trackers-list scrollbar">
                {previewData.trackers.map((url, i) => (
                  <div key={i} className="tracker-item-simple">
                    {url}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={handleClose}>Back</button>
          <button 
            className="btn btn-primary" 
            onClick={handleConfirm}
            disabled={isAdding || (previewData.files.length > 0 && selectedFiles.size === 0) || (isDuplicate && !duplicateAction)}
            style={{ minWidth: 140 }}
          >
            {isDuplicate && !duplicateAction ? 'Select Action' : isAdding ? 'Adding...' : 'Confirm & Start'}
          </button>
        </div>
      </div>
    </div>
  );
}
