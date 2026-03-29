import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { TorrentInfo, GlobalStats, FilterType, AppSettings, Category, SortOption, DownloadHistory, TorrentPreviewData } from '../types/torrent';

interface TorrentStore {
  torrents: TorrentInfo[];
  stats: GlobalStats;
  selectedId: number | null;
  filter: FilterType;
  searchQuery: string;
  settings: AppSettings;
  showAddModal: boolean;
  showSettings: boolean;
  categories: Record<number, Category>;
  sortBy: SortOption;
  sortDesc: boolean;
  downloadHistory: DownloadHistory[];
  previewData: TorrentPreviewData | null;
  previewSavePath: string;
  previewFilePath: string;
  previewMagnetUrl: string;

  // Actions
  setTorrents: (torrents: TorrentInfo[]) => void;
  setStats: (stats: GlobalStats) => void;
  setSelectedId: (id: number | null) => void;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (q: string) => void;
  updateSettings: (partial: Partial<AppSettings>, syncToBackend?: boolean) => void;
  initSettings: () => Promise<void>;
  setShowAddModal: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
  removeTorrent: (id: number) => void;
  setCategory: (torrentId: number, category: Category) => void;
  setSortBy: (sort: SortOption, desc?: boolean) => void;
  addToHistory: (history: DownloadHistory) => void;
  clearHistory: () => void;
  setPreviewData: (data: TorrentPreviewData | null) => void;
  setPreviewSavePath: (path: string) => void;
  setPreviewFilePath: (path: string) => void;
  setPreviewMagnetUrl: (url: string) => void;
  clearPreview: () => void;
}

const defaultStats: GlobalStats = {
  download_speed: 0,
  upload_speed: 0,
  active_torrents: 0,
  total_downloaded: 0,
  total_uploaded: 0,
  free_disk_space: 0,
  dht_nodes: 0,
};

const defaultSettings: AppSettings = {
  download_path: '/Downloads',
  download_limit_kbs: 0,
  upload_limit_kbs: 0,
  max_connections: 200,
  dht_enabled: true,
  pex_enabled: true,
  encryption: 'enabled',
  accent_color: 'cyan',
  animations: true,
  port: 6881,
  theme: 'dark',
  queue_mode: 'parallel',
  max_active_downloads: 3,
  notifications_enabled: true,
  check_duplicates: true,
  bandwidth_schedules: [],
  stop_seed_on_complete: false,
};

// Minimal torrent info for persistence (without files array to save space)
interface PersistedTorrent {
  id: number;
  name: string;
  info_hash: string;
  size: number;
  downloaded: number;
  uploaded: number;
  progress_pct: number;
  save_path: string;
  added_at: number;
  state: TorrentInfo['state'];
}

interface PersistedState {
  settings: AppSettings;
  recentTorrents: PersistedTorrent[];
  categories: Record<number, Category>;
  downloadHistory: DownloadHistory[];
  // UI state — restored on next launch
  filter: FilterType;
  sortBy: SortOption;
  sortDesc: boolean;
  searchQuery: string;
}

export const useTorrentStore = create<TorrentStore>()(
  persist(
    immer((set, get) => ({
      torrents: [],
      stats: defaultStats,
      selectedId: null,
      filter: 'all',
      searchQuery: '',
      settings: defaultSettings,
      showAddModal: false,
      showSettings: false,
      categories: {},
      sortBy: 'added_at',
      sortDesc: true,
      downloadHistory: [],
      previewData: null,
      previewSavePath: '/Downloads',
      previewFilePath: '',
      previewMagnetUrl: '',

      setTorrents: (torrents) => set((state) => { state.torrents = torrents; }),
      setStats: (stats) => set((state) => { state.stats = stats; }),
      setSelectedId: (id) => set((state) => { state.selectedId = id; }),
      setFilter: (filter) => set((state) => { state.filter = filter; }),
      setSearchQuery: (q) => set((state) => { state.searchQuery = q; }),
      updateSettings: (partial, syncToBackend = true) => {
        set((state) => {
          Object.assign(state.settings, partial);
        });
        if (syncToBackend) {
          invoke('update_settings', { settings: get().settings }).catch(console.error);
        }
      },
      initSettings: async () => {
        try {
          const backendSettings = await invoke<AppSettings>('get_settings');
          set((state) => {
            state.settings = { ...state.settings, ...backendSettings };
          });
        } catch (err) {
          console.error('Failed to load settings from backend:', err);
        }
      },
      setShowAddModal: (v) => set((state) => { state.showAddModal = v; }),
      setShowSettings: (v) => set((state) => { state.showSettings = v; }),
      removeTorrent: (id) => set((state) => {
        state.torrents = state.torrents.filter((t) => t.id !== id);
        delete state.categories[id];
        if (state.selectedId === id) state.selectedId = null;
      }),
      setCategory: (torrentId, category) => set((state) => {
        state.categories[torrentId] = category;
      }),
      setSortBy: (sort, desc = true) => set((state) => {
        state.sortBy = sort;
        state.sortDesc = desc;
      }),
      addToHistory: (history) => set((state) => {
        state.downloadHistory = [history, ...state.downloadHistory].slice(0, 100);
      }),
      clearHistory: () => set((state) => {
        state.downloadHistory = [];
      }),
      setPreviewData: (data) => set((state) => { state.previewData = data; }),
      setPreviewSavePath: (path) => set((state) => { state.previewSavePath = path; }),
      setPreviewFilePath: (path) => set((state) => { state.previewFilePath = path; }),
      setPreviewMagnetUrl: (url) => set((state) => { state.previewMagnetUrl = url; }),
      clearPreview: () => set((state) => {
        state.previewData = null;
        state.previewSavePath = state.settings.download_path;
        state.previewFilePath = '';
        state.previewMagnetUrl = '';
      }),
    })),
    {
      name: 'tozrt-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({
        settings: state.settings,
        recentTorrents: state.torrents.map(t => ({
          id: t.id,
          name: t.name,
          info_hash: t.info_hash,
          size: t.size,
          downloaded: t.downloaded,
          uploaded: t.uploaded,
          progress_pct: t.progress_pct,
          save_path: t.save_path,
          added_at: t.added_at,
          state: t.state,
        })),
        categories: state.categories,
        downloadHistory: state.downloadHistory.slice(0, 50),
        // Persist UI state
        filter: state.filter,
        sortBy: state.sortBy,
        sortDesc: state.sortDesc,
        searchQuery: state.searchQuery,
      }),
    }
  )
);
