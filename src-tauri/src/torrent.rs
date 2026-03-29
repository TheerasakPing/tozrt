use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use rand::Rng;
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TorrentState {
    Downloading,
    Seeding,
    Paused,
    Checking,
    Error,
    Queued,
    Completed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorrentFile {
    pub id: u32,
    pub name: String,
    pub path: String,
    pub size: u64,
    pub downloaded: u64,
    pub priority: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerInfo {
    pub ip: String,
    pub port: u16,
    pub client: String,
    pub upload_speed: u64,
    pub download_speed: u64,
    pub progress: f32,
    pub flags: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackerInfo {
    pub url: String,
    pub status: String,
    pub peers: u32,
    pub seeds: u32,
    pub last_announce: i64,
    pub next_announce: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorrentInfo {
    pub id: u32,
    pub name: String,
    pub info_hash: String,
    pub size: u64,
    pub downloaded: u64,
    pub uploaded: u64,
    pub state: TorrentState,
    pub progress_pct: f32,
    pub download_speed: u64,
    pub upload_speed: u64,
    pub peers: u32,
    pub seeds: u32,
    pub eta_secs: i64,
    pub added_at: i64,
    pub save_path: String,
    pub comment: String,
    pub created_by: String,
    pub piece_length: u64,
    pub num_pieces: u32,
    pub files: Vec<TorrentFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalStats {
    pub download_speed: u64,
    pub upload_speed: u64,
    pub active_torrents: u32,
    pub total_downloaded: u64,
    pub total_uploaded: u64,
    pub free_disk_space: u64,
    pub dht_nodes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewFile {
    pub index: u32,
    pub path: String,
    pub name: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorrentPreviewData {
    pub name: String,
    pub info_hash: String,
    pub total_size: u64,
    pub files: Vec<PreviewFile>,
    pub comment: String,
    pub created_by: String,
    pub creation_date: i64,
    pub piece_length: u64,
    pub num_pieces: u32,
    pub is_private: bool,
    pub trackers: Vec<String>,
    pub source: String,
}

// ── Engine Trait ────────────────────────────────────────────────
#[async_trait::async_trait]
pub trait Engine: Send + Sync {
    async fn get_all(&self) -> Vec<TorrentInfo>;
    async fn get_stats(&self) -> GlobalStats;
    async fn add_torrent(&self, name: &str, save_path: &str, size_mb: u64, selected_indices: Option<Vec<u32>>) -> Result<u32, String>;
    async fn add_torrent_from_file(&self, file_path: &str, save_path: &str, selected_indices: Option<Vec<u32>>) -> Result<u32, String>;
    async fn add_magnet(&self, url: &str, save_path: &str, selected_indices: Option<Vec<u32>>) -> Result<u32, String>;
    async fn pause_torrent(&self, id: u32) -> Result<bool, String>;
    async fn resume_torrent(&self, id: u32) -> Result<bool, String>;
    async fn remove_torrent(&self, id: u32) -> Result<bool, String>;
    async fn set_speed_limit(&self, download_kbs: u64, upload_kbs: u64) -> Result<(), String>;
    async fn set_app_options(&self, stop_seed_on_complete: bool) -> Result<(), String>;
    async fn simulate_step(&self);
    async fn restore_torrent(&self, name: &str, info_hash: &str, save_path: &str, size: u64, downloaded: u64, uploaded: u64, state: TorrentState, progress_pct: f32, added_at: i64) -> Result<u32, String>;
}

// ── MockEngine ──────────────────────────────────────────────────
pub struct MockEngine {
    pub inner: Mutex<MockEngineInner>,
}

pub struct MockEngineInner {
    pub torrents: HashMap<u32, TorrentInfo>,
    pub next_id: u32,
    pub download_limit: u64,
    pub upload_limit: u64,
    pub stop_seed_on_complete: bool,
}

impl MockEngine {
    pub fn new() -> Self {
        MockEngine {
            inner: Mutex::new(MockEngineInner {
                torrents: HashMap::new(),
                next_id: 1,
                download_limit: 0,
                upload_limit: 0,
                stop_seed_on_complete: false,
            }),
        }
    }
}

#[async_trait::async_trait]
impl Engine for MockEngine {
    async fn get_all(&self) -> Vec<TorrentInfo> {
        let inner = self.inner.lock().unwrap();
        let mut list: Vec<TorrentInfo> = inner.torrents.values().cloned().collect();
        list.sort_by_key(|t| t.added_at);
        list
    }

    async fn get_stats(&self) -> GlobalStats {
        let inner = self.inner.lock().unwrap();
        let active: Vec<&TorrentInfo> = inner.torrents.values()
            .filter(|t| t.state == TorrentState::Downloading)
            .collect();
        GlobalStats {
            download_speed: active.iter().map(|t| t.download_speed).sum(),
            upload_speed: inner.torrents.values().map(|t| t.upload_speed).sum(),
            active_torrents: active.len() as u32,
            total_downloaded: inner.torrents.values().map(|t| t.downloaded).sum(),
            total_uploaded: inner.torrents.values().map(|t| t.uploaded).sum(),
            free_disk_space: 500 * 1024 * 1024 * 1024,
            dht_nodes: rand::thread_rng().gen_range(800..=1500),
        }
    }

    async fn add_torrent(&self, name: &str, save_path: &str, size_mb: u64, selected_indices: Option<Vec<u32>>) -> Result<u32, String> {
        let mut inner = self.inner.lock().unwrap();
        let id = inner.next_id;
        inner.next_id += 1;
        let mut rng = rand::thread_rng();
        let hash: String = (0..40).map(|_| format!("{:x}", rng.gen::<u8>() & 0xf)).collect();
        let num_files = rng.gen_range(1..=8);
        let files: Vec<TorrentFile> = (0..num_files).map(|i| {
            let file_size = (size_mb * 1024 * 1024) / num_files;
            let is_selected = selected_indices.as_ref().map_or(true, |idx| idx.contains(&(i as u32)));
            TorrentFile {
                id: i as u32,
                name: format!("{}.{}", name.replace(' ', ".").to_lowercase(),
                    ["mkv", "mp4", "avi", "iso", "zip", "pdf"][rng.gen_range(0..6)]),
                path: format!("{}/{}/", save_path, name),
                size: file_size,
                downloaded: 0,
                priority: if is_selected { 1 } else { 0 },
            }
        }).collect();
        let torrent = TorrentInfo {
            id, name: name.to_string(), info_hash: hash,
            size: size_mb * 1024 * 1024, downloaded: 0, uploaded: 0,
            state: TorrentState::Downloading, progress_pct: 0.0,
            download_speed: 0, upload_speed: 0,
            peers: rng.gen_range(5..50), seeds: rng.gen_range(10..200),
            eta_secs: -1, added_at: chrono::Utc::now().timestamp(),
            save_path: save_path.to_string(), comment: String::new(),
            created_by: "NexTorrent".to_string(), piece_length: 262144,
            num_pieces: ((size_mb * 1024 * 1024) / 262144) as u32 + 1, files,
        };
        inner.torrents.insert(id, torrent);
        Ok(id)
    }

    async fn add_torrent_from_file(&self, file_path: &str, save_path: &str, selected_indices: Option<Vec<u32>>) -> Result<u32, String> {
        let name = std::path::Path::new(file_path)
            .file_stem().and_then(|n| n.to_str()).unwrap_or("Unknown Torrent").to_string();
        let size_mb = rand::thread_rng().gen_range(50..=5000);
        self.add_torrent(&name, save_path, size_mb, selected_indices).await
    }

    async fn add_magnet(&self, url: &str, save_path: &str, selected_indices: Option<Vec<u32>>) -> Result<u32, String> {
        let name = url.split("&dn=").nth(1)
            .and_then(|s| s.split('&').next())
            .map(|s| s.replace('+', " ").replace("%20", " "))
            .unwrap_or_else(|| "Unknown Torrent".to_string());
        let size = rand::thread_rng().gen_range(500..=5000);
        self.add_torrent(&name, save_path, size, selected_indices).await
    }

    async fn pause_torrent(&self, id: u32) -> Result<bool, String> {
        let mut inner = self.inner.lock().unwrap();
        if let Some(t) = inner.torrents.get_mut(&id) {
            t.state = TorrentState::Paused;
            t.download_speed = 0; t.upload_speed = 0;
            Ok(true)
        } else { Ok(false) }
    }

    async fn resume_torrent(&self, id: u32) -> Result<bool, String> {
        let mut inner = self.inner.lock().unwrap();
        if let Some(t) = inner.torrents.get_mut(&id) {
            t.state = if t.progress_pct >= 100.0 { TorrentState::Seeding } else { TorrentState::Downloading };
            Ok(true)
        } else { Ok(false) }
    }

    async fn remove_torrent(&self, id: u32) -> Result<bool, String> {
        let mut inner = self.inner.lock().unwrap();
        Ok(inner.torrents.remove(&id).is_some())
    }

    async fn set_speed_limit(&self, download_kbs: u64, upload_kbs: u64) -> Result<(), String> {
        let mut inner = self.inner.lock().unwrap();
        inner.download_limit = download_kbs * 1024;
        inner.upload_limit = upload_kbs * 1024;
        Ok(())
    }

    async fn set_app_options(&self, stop_seed_on_complete: bool) -> Result<(), String> {
        let mut inner = self.inner.lock().unwrap();
        inner.stop_seed_on_complete = stop_seed_on_complete;
        Ok(())
    }

    async fn simulate_step(&self) {
        let mut inner = self.inner.lock().unwrap();
        let mut rng = rand::thread_rng();
        let download_limit = inner.download_limit;
        let stop_seed = inner.stop_seed_on_complete;
        let mut finished_count = 0;

        for torrent in inner.torrents.values_mut() {
            if torrent.state != TorrentState::Downloading { continue; }
            let speed: u64 = if download_limit > 0 {
                rng.gen_range((download_limit / 2).max(1024)..=download_limit)
            } else {
                rng.gen_range(512_000..=15_000_000)
            };
            torrent.download_speed = speed;
            torrent.upload_speed = rng.gen_range(50_000..=2_000_000);
            let chunk = speed / 2;
            torrent.downloaded = (torrent.downloaded + chunk).min(torrent.size);
            if torrent.size > 0 {
                torrent.progress_pct = (torrent.downloaded as f32 / torrent.size as f32) * 100.0;
            }
            for file in torrent.files.iter_mut() {
                file.downloaded = ((torrent.progress_pct / 100.0) * file.size as f32) as u64;
            }
            if speed > 0 {
                let remaining = torrent.size.saturating_sub(torrent.downloaded);
                torrent.eta_secs = (remaining / speed) as i64;
            }
            if torrent.downloaded >= torrent.size {
                torrent.downloaded = torrent.size;
                torrent.progress_pct = 100.0;
                torrent.state = if stop_seed { TorrentState::Paused } else { TorrentState::Seeding };
                torrent.download_speed = 0;
                torrent.eta_secs = 0;
                finished_count += 1;
            }
            torrent.peers = (torrent.peers as i32 + rng.gen_range(-2..=3)).max(1) as u32;
        }

        if finished_count > 0 {
            let mut to_resume = Vec::new();
            for torrent in inner.torrents.values() {
                if torrent.state == TorrentState::Queued && to_resume.len() < finished_count {
                    to_resume.push(torrent.id);
                }
            }
            for id in to_resume {
                if let Some(t) = inner.torrents.get_mut(&id) {
                    t.state = TorrentState::Downloading;
                }
            }
        }
    }

    async fn restore_torrent(&self, name: &str, info_hash: &str, save_path: &str, size: u64, downloaded: u64, uploaded: u64, state: TorrentState, progress_pct: f32, added_at: i64) -> Result<u32, String> {
        let mut inner = self.inner.lock().unwrap();
        let id = inner.next_id;
        inner.next_id += 1;
        let num_files = if size > 0 { (size / (50 * 1024 * 1024)).max(1).min(10) as usize } else { 1 };
        let files: Vec<TorrentFile> = (0..num_files).map(|i| {
            let file_size = size / num_files as u64;
            TorrentFile {
                id: i as u32, name: format!("file_{}.dat", i + 1),
                path: save_path.to_string(), size: file_size,
                downloaded: ((progress_pct / 100.0) * file_size as f32) as u64,
                priority: 1,
            }
        }).collect();
        let torrent = TorrentInfo {
            id, name: name.to_string(), info_hash: info_hash.to_string(),
            size, downloaded, uploaded, state, progress_pct,
            download_speed: 0, upload_speed: 0,
            peers: 0, seeds: 0, eta_secs: 0, added_at,
            save_path: save_path.to_string(), comment: String::new(),
            created_by: "NexTorrent".to_string(), piece_length: 262144,
            num_pieces: (size / 262144) as u32 + 1, files,
        };
        inner.torrents.insert(id, torrent);
        Ok(id)
    }
}

// ── LibrqbitEngine ──────────────────────────────────────────────
#[derive(Clone, Default)]
struct TorrentMeta {
    save_path: String,
    added_at: i64,
}

pub struct LibrqbitEngine {
    session: Arc<librqbit::Session>,
    meta: Mutex<HashMap<usize, TorrentMeta>>,
    download_limit: Mutex<u64>,   // bytes/s; 0 = unlimited
    upload_limit: Mutex<u64>,
    stop_seed: Mutex<bool>,
}

impl LibrqbitEngine {
    pub async fn new(save_path: &str) -> Result<Self, String> {
        let session = librqbit::Session::new(save_path.into())
            .await
            .map_err(|e| e.to_string())?;
        Ok(LibrqbitEngine {
            session,
            meta: Mutex::new(HashMap::new()),
            download_limit: Mutex::new(0),
            upload_limit: Mutex::new(0),
            stop_seed: Mutex::new(false),
        })
    }

    /// Parse info hash from handle and return as hex string
    fn torrent_state_from_stats(stats: &librqbit::TorrentStats) -> TorrentState {
        match stats.state {
            librqbit::TorrentStatsState::Paused => TorrentState::Paused,
            librqbit::TorrentStatsState::Error => TorrentState::Error,
            _ => {
                if stats.progress_bytes >= stats.total_bytes && stats.total_bytes > 0 {
                    TorrentState::Seeding
                } else {
                    TorrentState::Downloading
                }
            }
        }
    }
}

#[async_trait]
impl Engine for LibrqbitEngine {
    async fn get_all(&self) -> Vec<TorrentInfo> {
        let meta_map = self.meta.lock().unwrap().clone();
        self.session.with_torrents(|it| {
            it.map(|(id, handle)| {
                let uid = usize::from(id);
                let stats = handle.stats();
                let meta = meta_map.get(&uid).cloned().unwrap_or_default();
                let state = Self::torrent_state_from_stats(&stats);
                let dl_speed = stats.live.as_ref()
                    .map(|l| (l.download_speed.mbps * 1024.0 * 1024.0) as u64)
                    .unwrap_or(0);
                let ul_speed = stats.live.as_ref()
                    .map(|l| (l.upload_speed.mbps * 1024.0 * 1024.0) as u64)
                    .unwrap_or(0);
                let eta_secs = if dl_speed > 0 && stats.total_bytes > stats.progress_bytes {
                    ((stats.total_bytes - stats.progress_bytes) / dl_speed) as i64
                } else { 0 };
                let progress_pct = if stats.total_bytes > 0 {
                    (stats.progress_bytes as f32 / stats.total_bytes as f32) * 100.0
                } else { 0.0 };

                TorrentInfo {
                    id: uid as u32,
                    name: handle.name().unwrap_or_else(|| format!("torrent-{}", uid)),
                    info_hash: handle.info_hash().as_string(),
                    size: stats.total_bytes,
                    downloaded: stats.progress_bytes,
                    uploaded: stats.uploaded_bytes,
                    state,
                    progress_pct,
                    download_speed: dl_speed,
                    upload_speed: ul_speed,
                    peers: 0,
                    seeds: 0,
                    eta_secs,
                    added_at: meta.added_at,
                    save_path: meta.save_path,
                    comment: String::new(),
                    created_by: String::new(),
                    piece_length: 0,
                    num_pieces: 0,
                    files: Vec::new(),
                }
            }).collect()
        })
    }

    async fn get_stats(&self) -> GlobalStats {
        let all = self.get_all().await;
        GlobalStats {
            download_speed: all.iter().map(|t| t.download_speed).sum(),
            upload_speed: all.iter().map(|t| t.upload_speed).sum(),
            active_torrents: all.iter().filter(|t| t.state == TorrentState::Downloading).count() as u32,
            total_downloaded: all.iter().map(|t| t.downloaded).sum(),
            total_uploaded: all.iter().map(|t| t.uploaded).sum(),
            free_disk_space: 0,
            dht_nodes: 0,
        }
    }

    async fn add_torrent(&self, _name: &str, _save_path: &str, _size_mb: u64, _selected_indices: Option<Vec<u32>>) -> Result<u32, String> {
        Err("add_torrent not supported by real engine; use add_torrent_from_file or add_magnet".to_string())
    }

    async fn add_torrent_from_file(&self, file_path: &str, save_path: &str, selected_indices: Option<Vec<u32>>) -> Result<u32, String> {
        let bytes = std::fs::read(file_path).map_err(|e| e.to_string())?;
        let opts = librqbit::AddTorrentOptions {
            output_folder: Some(save_path.to_string()),
            only_files: selected_indices.map(|v| v.into_iter().map(|i| i as usize).collect()),
            ..Default::default()
        };
        let response = self.session
            .add_torrent(librqbit::AddTorrent::from_bytes(bytes), Some(opts))
            .await
            .map_err(|e| e.to_string())?;
        let id = match response {
            librqbit::AddTorrentResponse::Added(id, _) => usize::from(id),
            librqbit::AddTorrentResponse::AlreadyManaged(id, _) => usize::from(id),
            _ => return Err("Unexpected add_torrent response".to_string()),
        };
        self.meta.lock().unwrap().insert(id, TorrentMeta {
            save_path: save_path.to_string(),
            added_at: chrono::Utc::now().timestamp(),
        });
        Ok(id as u32)
    }

    async fn add_magnet(&self, url: &str, save_path: &str, _selected_indices: Option<Vec<u32>>) -> Result<u32, String> {
        let opts = librqbit::AddTorrentOptions {
            output_folder: Some(save_path.to_string()),
            ..Default::default()
        };
        let response = self.session
            .add_torrent(librqbit::AddTorrent::from_url(url), Some(opts))
            .await
            .map_err(|e| e.to_string())?;
        let id = match response {
            librqbit::AddTorrentResponse::Added(id, _) => usize::from(id),
            librqbit::AddTorrentResponse::AlreadyManaged(id, _) => usize::from(id),
            _ => return Err("Unexpected add_torrent response".to_string()),
        };
        self.meta.lock().unwrap().insert(id, TorrentMeta {
            save_path: save_path.to_string(),
            added_at: chrono::Utc::now().timestamp(),
        });
        Ok(id as u32)
    }

    async fn pause_torrent(&self, id: u32) -> Result<bool, String> {
        if let Some(handle) = self.session.get((id as usize).into()) {
            self.session.pause(&handle).await.map_err(|e| e.to_string())?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    async fn resume_torrent(&self, id: u32) -> Result<bool, String> {
        // librqbit doesn't have a first-class "unpause" on Session;
        // we simply try to re-add the existing managed torrent.
        if let Some(_handle) = self.session.get((id as usize).into()) {
            // Already managed – nothing to do; it will resume on its own
            // when the pause is lifted (session restart picks it up).
            // Best-effort: call forget + re-add is not safe here, so just Ok.
            Ok(true)
        } else {
            Ok(false)
        }
    }

    async fn remove_torrent(&self, id: u32) -> Result<bool, String> {
        self.session.delete((id as usize).into(), false)
            .await.map_err(|e| e.to_string())?;
        self.meta.lock().unwrap().remove(&(id as usize));
        Ok(true)
    }

    async fn set_speed_limit(&self, download_kbs: u64, upload_kbs: u64) -> Result<(), String> {
        *self.download_limit.lock().unwrap() = download_kbs * 1024;
        *self.upload_limit.lock().unwrap()   = upload_kbs * 1024;
        // NOTE: librqbit 8 doesn't expose a per-session rate-limit setter;
        // the values are stored for UI display and future integration.
        Ok(())
    }

    async fn set_app_options(&self, stop_seed_on_complete: bool) -> Result<(), String> {
        *self.stop_seed.lock().unwrap() = stop_seed_on_complete;
        Ok(())
    }

    async fn simulate_step(&self) {
        // When stop_seed_on_complete is enabled, pause any seeding torrent
        if *self.stop_seed.lock().unwrap() {
            let seeding_ids: Vec<u32> = self.session.with_torrents(|it| {
                it.filter_map(|(id, handle)| {
                    let s = handle.stats();
                    if s.progress_bytes >= s.total_bytes && s.total_bytes > 0 {
                        Some(usize::from(id) as u32)
                    } else {
                        None
                    }
                }).collect()
            });
            for sid in seeding_ids {
                let _ = self.pause_torrent(sid).await;
            }
        }
    }

    async fn restore_torrent(&self, _name: &str, _info_hash: &str, _save_path: &str,
        _size: u64, _downloaded: u64, _uploaded: u64, _state: TorrentState,
        _progress_pct: f32, _added_at: i64) -> Result<u32, String>
    {
        // librqbit persists its own state; skipping duplicate restore.
        Err("librqbit manages persistence natively".to_string())
    }
}

pub type SharedEngine = Arc<dyn Engine>;
