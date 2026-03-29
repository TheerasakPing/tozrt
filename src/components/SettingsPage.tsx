import React from 'react';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { useTorrentStore } from '../store/torrentStore';
import { useTauriCommands } from '../hooks/useTorrent';
import type { QueueMode } from '../types/torrent';

export function SettingsPage(): React.JSX.Element {
  const { settings, updateSettings, setShowSettings } = useTorrentStore();
  const cmds = useTauriCommands();

  const handleSpeedLimit = (dl: number, ul: number): void => {
    updateSettings({ download_limit_kbs: dl, upload_limit_kbs: ul });
    cmds.setSpeedLimit(dl, ul);
  };

  const handleBrowse = async (): Promise<void> => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: settings.download_path,
        title: 'Select Download Directory'
      });

      if (selected && typeof selected === 'string') {
        updateSettings({ download_path: selected });
      }
    } catch (err) {
      console.error('Failed to open directory picker:', err);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px', borderBottom: '1px solid var(--glass-border)',
        background: 'var(--bg-surface)',
      }}>
        <button className="btn-icon" onClick={() => setShowSettings(false)}>
          <ArrowLeft size={14} />
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 2, color: 'var(--neon-cyan)' }}>
          SETTINGS
        </span>
      </div>

      <div className="settings-page">
        {/* Downloads */}
        <div className="settings-section">
          <div className="settings-section-title">Downloads</div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Default Save Path</div>
              <div className="settings-desc">Where torrents are saved by default</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="form-input"
                style={{ width: 220 }}
                value={settings.download_path}
                onChange={(e) => updateSettings({ download_path: e.target.value })}
              />
              <button className="btn btn-secondary" onClick={handleBrowse} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
                <FolderOpen size={14} />
                <span>Browse</span>
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Download Limit</div>
              <div className="settings-desc">0 = unlimited</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                className="form-input"
                style={{ width: 80 }}
                type="number"
                min={0}
                value={settings.download_limit_kbs}
                onChange={(e) => handleSpeedLimit(+e.target.value, settings.upload_limit_kbs)}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>KB/s</span>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Upload Limit</div>
              <div className="settings-desc">0 = unlimited</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                className="form-input"
                style={{ width: 80 }}
                type="number"
                min={0}
                value={settings.upload_limit_kbs}
                onChange={(e) => handleSpeedLimit(settings.download_limit_kbs, +e.target.value)}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>KB/s</span>
            </div>
          </div>
        </div>

        {/* Network */}
        <div className="settings-section">
          <div className="settings-section-title">Network</div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Listen Port</div>
              <div className="settings-desc">Auto-random or set manually</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                className="form-input"
                style={{ width: 80 }}
                type="number"
                value={settings.port}
                onChange={(e) => updateSettings({ port: +e.target.value })}
              />
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const bestPorts = [
                    49160, 49161, 49162, 49163, 49164, 49165, 49166, 49167,
                    51413, 52313, 52413, 53413, 53513, 54413, 54513, 55413,
                    55513, 56413, 56513, 57413, 57513, 58413, 58513, 59413,
                    59513, 60413, 60513, 61413, 61513, 62413, 62513, 63413,
                    63513, 64413, 64513, 65413, 65513,
                  ];
                  const randomPort = bestPorts[Math.floor(Math.random() * bestPorts.length)];
                  updateSettings({ port: randomPort });
                }}
                style={{ fontSize: 10, padding: '4px 8px' }}
              >
                Best Port
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">DHT</div>
              <div className="settings-desc">Distributed Hash Table — enable peer discovery</div>
            </div>
            <div className={`toggle ${settings.dht_enabled ? 'on' : ''}`}
              onClick={() => updateSettings({ dht_enabled: !settings.dht_enabled })} />
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Peer Exchange (PEX)</div>
              <div className="settings-desc">Share peer lists between connected clients</div>
            </div>
            <div className={`toggle ${settings.pex_enabled ? 'on' : ''}`}
              onClick={() => updateSettings({ pex_enabled: !settings.pex_enabled })} />
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Max Connections</div>
            </div>
            <input
              className="form-input"
              style={{ width: 80 }}
              type="number"
              value={settings.max_connections}
              onChange={(e) => updateSettings({ max_connections: +e.target.value })}
            />
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Encryption</div>
              <div className="settings-desc">Security level for peer communication</div>
            </div>
            <select
              className="form-input"
              style={{ width: 100 }}
              value={settings.encryption}
              onChange={(e) => updateSettings({ encryption: e.target.value as any })}
            >
              <option value="enabled">Enabled</option>
              <option value="forced">Forced</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-section">
          <div className="settings-section-title">Appearance</div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Accent Color</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['cyan', 'magenta', 'green'] as const).map((c) => {
                const colors = { cyan: '#00f5ff', magenta: '#ff00a0', green: '#39ff14' };
                return (
                  <div
                    key={c}
                    onClick={() => updateSettings({ accent_color: c })}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: colors[c],
                      cursor: 'pointer',
                      boxShadow: settings.accent_color === c ? `0 0 12px ${colors[c]}` : 'none',
                      border: settings.accent_color === c ? `2px solid white` : '2px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Animations</div>
              <div className="settings-desc">Neon glow and motion effects</div>
            </div>
            <div className={`toggle ${settings.animations ? 'on' : ''}`}
              onClick={() => updateSettings({ animations: !settings.animations })} />
          </div>
        </div>

        {/* Queue */}
        <div className="settings-section">
          <div className="settings-section-title">Queue</div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Queue Mode</div>
              <div className="settings-desc">How downloads are queued</div>
            </div>
            <select
              className="form-input"
              style={{ width: 100 }}
              value={settings.queue_mode}
              onChange={(e) => updateSettings({ queue_mode: e.target.value as QueueMode })}
            >
              <option value="parallel">Parallel</option>
              <option value="sequential">Sequential</option>
            </select>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Max Active Downloads</div>
              <div className="settings-desc">Maximum concurrent downloads</div>
            </div>
            <input
              className="form-input"
              style={{ width: 60 }}
              type="number"
              min={1}
              max={10}
              value={settings.max_active_downloads}
              onChange={(e) => updateSettings({ max_active_downloads: +e.target.value })}
            />
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Stop Seeding When Complete</div>
              <div className="settings-desc">Pause torrent automatically when download finishes</div>
            </div>
            <div className={`toggle ${settings.stop_seed_on_complete ? 'on' : ''}`}
              onClick={() => updateSettings({ stop_seed_on_complete: !settings.stop_seed_on_complete })} />
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <div className="settings-section-title">Notifications</div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Enable Notifications</div>
              <div className="settings-desc">Notify when download completes</div>
            </div>
            <div className={`toggle ${settings.notifications_enabled ? 'on' : ''}`}
              onClick={() => updateSettings({ notifications_enabled: !settings.notifications_enabled })} />
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Check Duplicates</div>
              <div className="settings-desc">Prevent adding duplicate torrents</div>
            </div>
            <div className={`toggle ${settings.check_duplicates ? 'on' : ''}`}
              onClick={() => updateSettings({ check_duplicates: !settings.check_duplicates })} />
          </div>
        </div>

        {/* Bandwidth Schedules */}
        <div className="settings-section">
          <div className="settings-section-title">Bandwidth Schedules</div>
          <div className="settings-desc" style={{ marginBottom: 12 }}>
            Automatically limit speeds during specific times.
          </div>

          {settings.bandwidth_schedules.length === 0 ? (
            <div style={{
              padding: '20px', textAlign: 'center', color: 'var(--text-muted)',
              border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-md)',
              fontSize: 12
            }}>
              No schedules defined.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {settings.bandwidth_schedules.map((s) => (
                <div key={s.id} style={{
                  padding: '12px', border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)', background: 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-main)' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {s.start_hour}:00 - {s.end_hour}:00 · {s.download_kbs} KB/s ↓
                    </div>
                  </div>
                  <div className={`toggle ${s.enabled ? 'on' : ''}`}
                    onClick={() => {
                      const newSchedules = settings.bandwidth_schedules.map(item =>
                        item.id === s.id ? { ...item, enabled: !item.enabled } : item
                      );
                      updateSettings({ bandwidth_schedules: newSchedules });
                    }}
                  />
                </div>
              ))}
            </div>
          )
          }

          <button className="btn btn-secondary" style={{ marginTop: 12, width: '100%' }} onClick={() => {
            const newSchedule = {
              id: crypto.randomUUID(),
              name: 'Night Limit',
              enabled: true,
              download_kbs: 1000,
              upload_kbs: 500,
              days: [0, 1, 2, 3, 4, 5, 6],
              start_hour: 0,
              end_hour: 6
            };
            updateSettings({ bandwidth_schedules: [...settings.bandwidth_schedules, newSchedule] });
          }}>
            Add New Schedule
          </button>
        </div>

        {/* About */}
        <div className="settings-section">
          <div className="settings-section-title">About</div>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)', padding: '16px',
            fontFamily: 'var(--font-mono)', fontSize: 12
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--neon-cyan)', marginBottom: 8 }}>
              NEXTORRENT v1.0.0
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              Built with Tauri V2 · Rust · React · TypeScript<br />
              Powered by Bun.js · Tokio · Zustand
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
