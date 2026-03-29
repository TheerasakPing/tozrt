import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useTorrentStore } from '../store/torrentStore';
import type { TorrentInfo, GlobalStats } from '../types/torrent';

interface PersistedTorrentMinimal {
  name: string;
  info_hash: string;
  size: number;
  save_path: string;
  downloaded?: number;
  uploaded?: number;
  state: string;
  progress_pct?: number;
  added_at: number;
}

export function useTorrentEvents() {
  const { setTorrents, setStats } = useTorrentStore();
  const hasRestored = useRef(false);

  useEffect(() => {
    const restoreTorrents = async () => {
      if (hasRestored.current) return;
      hasRestored.current = true;

      const stored = localStorage.getItem('tozrt-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.state?.recentTorrents?.length > 0) {
            const persisted: PersistedTorrentMinimal[] = parsed.state.recentTorrents;
            const restored = await invoke<TorrentInfo[]>('restore_torrents', { 
              torrents: persisted.map(t => ({
                name: t.name,
                info_hash: t.info_hash,
                size: t.size,
                save_path: t.save_path,
                downloaded: t.downloaded ?? 0,
                uploaded: t.uploaded ?? 0,
                state: t.state,
                progress_pct: t.progress_pct ?? (t.size > 0 ? ((t.downloaded ?? 0) / t.size) * 100 : 0),
                added_at: t.added_at,
              }))
            }).catch(() => []);
            if (restored.length > 0) {
              const current = await invoke<TorrentInfo[]>('get_torrents').catch(() => restored);
              setTorrents(current);
              return;
            }
          }
        } catch (e) {
          console.error('Failed to restore torrents:', e);
        }
      }
      invoke<TorrentInfo[]>('get_torrents').then(setTorrents).catch(console.error);
    };

    restoreTorrents();

    const unlistenTorrents = listen<TorrentInfo[]>('torrent:update', (event) => {
      setTorrents(event.payload);
    });

    const unlistenStats = listen<GlobalStats>('stats:update', (event) => {
      setStats(event.payload);
    });

    invoke<GlobalStats>('get_stats').then(setStats).catch(console.error);

    return () => {
      unlistenTorrents.then((fn) => fn());
      unlistenStats.then((fn) => fn());
    };
  }, []);
}

export function useTauriCommands() {
  return {
    addMagnet: (url: string, savePath: string) =>
      invoke<number>('add_magnet', { url, savePath }),

    addTorrentFile: (filePath: string, savePath: string) =>
      invoke<number>('add_torrent_file', { filePath, savePath }),

    startTorrent: (source: string, pathOrUrl: string, savePath: string, selectedIndices: number[]) =>
      invoke<number>('start_torrent', { source, pathOrUrl, savePath, selectedIndices }),

    parseTorrentFile: (filePath: string) =>
      invoke<any>('parse_torrent_file', { filePath }),

    parseMagnetLink: (url: string) =>
      invoke<any>('parse_magnet_link', { url }),

    pause: (id: number) => invoke<boolean>('pause_torrent', { id }),
    resume: (id: number) => invoke<boolean>('resume_torrent', { id }),
    remove: (id: number, deleteFiles: boolean) =>
      invoke<boolean>('remove_torrent', { id, deleteFiles }),

    setSpeedLimit: (downloadKbs: number, uploadKbs: number) =>
      invoke<void>('set_speed_limit', { downloadKbs, uploadKbs }),

    getFiles: (id: number) => invoke('get_torrent_files', { id }),
    getPeers: (id: number) => invoke('get_peers', { id }),
    getTrackers: (id: number) => invoke('get_trackers', { id }),
  };
}
