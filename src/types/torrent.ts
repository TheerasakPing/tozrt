export type TorrentState = 'downloading' | 'seeding' | 'paused' | 'checking' | 'error' | 'queued' | 'completed';

export type Category = 'movies' | 'music' | 'games' | 'software' | 'documents' | 'images' | 'videos' | 'other' | 'uncategorized';

export type QueueMode = 'sequential' | 'parallel';

export type SortOption = 'name' | 'size' | 'progress' | 'download_speed' | 'upload_speed' | 'eta' | 'added_at';

export interface BandwidthSchedule {
  id: string;
  name: string;
  enabled: boolean;
  download_kbs: number;
  upload_kbs: number;
  days: number[];
  start_hour: number;
  end_hour: number;
}

export interface DownloadHistory {
  id: number;
  name: string;
  info_hash: string;
  size: number;
  downloaded: number;
  uploaded: number;
  save_path: string;
  completed_at: number;
  category: Category;
}

export interface TorrentPriority {
  torrent_id: number;
  priority: number;
}

export interface TorrentFile {
  id: number;
  name: string;
  path: string;
  size: number;
  downloaded: number;
  priority: number;
}

export interface PeerInfo {
  ip: string;
  port: number;
  client: string;
  upload_speed: number;
  download_speed: number;
  progress: number;
  flags: string;
}

export interface TrackerInfo {
  url: string;
  status: string;
  peers: number;
  seeds: number;
  last_announce: number;
  next_announce: number;
}

export interface TorrentInfo {
  id: number;
  name: string;
  info_hash: string;
  size: number;
  downloaded: number;
  uploaded: number;
  state: TorrentState;
  progress_pct: number;
  download_speed: number;
  upload_speed: number;
  peers: number;
  seeds: number;
  eta_secs: number;
  added_at: number;
  save_path: string;
  comment: string;
  created_by: string;
  piece_length: number;
  num_pieces: number;
  files: TorrentFile[];
  category?: Category;
}

export interface GlobalStats {
  download_speed: number;
  upload_speed: number;
  active_torrents: number;
  total_downloaded: number;
  total_uploaded: number;
  free_disk_space: number;
  dht_nodes: number;
}

export type FilterType = 'all' | 'downloading' | 'seeding' | 'paused' | 'completed' | 'error' | 'history';

export interface AppSettings {
  download_path: string;
  download_limit_kbs: number;
  upload_limit_kbs: number;
  max_connections: number;
  dht_enabled: boolean;
  pex_enabled: boolean;
  encryption: 'enabled' | 'forced' | 'disabled';
  accent_color: 'cyan' | 'magenta' | 'green';
  animations: boolean;
  port: number;
  theme: 'dark' | 'light';
  queue_mode: QueueMode;
  max_active_downloads: number;
  notifications_enabled: boolean;
  check_duplicates: boolean;
  bandwidth_schedules: BandwidthSchedule[];
  stop_seed_on_complete: boolean;
}

export interface PreviewFile {
  index: number;
  path: string;
  name: string;
  size: number;
}

export interface TorrentPreviewData {
  name: string;
  info_hash: string;
  total_size: number;
  files: PreviewFile[];
  comment: string;
  created_by: string;
  creation_date: number;
  piece_length: number;
  num_pieces: number;
  is_private: boolean;
  trackers: string[];
  source: 'file' | 'magnet';
}
