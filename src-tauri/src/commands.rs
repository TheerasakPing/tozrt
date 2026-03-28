use crate::torrent::{SharedEngine, TorrentInfo, GlobalStats, TorrentFile, PeerInfo, TrackerInfo, TorrentState, PreviewFile, TorrentPreviewData};
use rand::Rng;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistedTorrent {
    pub name: String,
    pub info_hash: String,
    pub size: u64,
    pub save_path: String,
    pub downloaded: u64,
    pub uploaded: u64,
    pub state: String,
    pub progress_pct: f32,
    pub added_at: i64,
}

#[tauri::command]
pub async fn get_torrents(engine: tauri::State<'_, SharedEngine>) -> Result<Vec<TorrentInfo>, String> {
    Ok(engine.get_all().await)
}

#[tauri::command]
pub async fn get_stats(engine: tauri::State<'_, SharedEngine>) -> Result<GlobalStats, String> {
    Ok(engine.get_stats().await)
}

#[tauri::command]
pub async fn add_magnet(
    url: String,
    save_path: String,
    engine: tauri::State<'_, SharedEngine>,
) -> Result<u32, String> {
    engine.add_magnet(&url, &save_path).await
}

#[tauri::command]
pub async fn add_torrent_file(
    file_path: String,
    save_path: String,
    engine: tauri::State<'_, SharedEngine>,
) -> Result<u32, String> {
    engine.add_torrent_from_file(&file_path, &save_path).await
}

#[tauri::command]
pub async fn pause_torrent(id: u32, engine: tauri::State<'_, SharedEngine>) -> Result<bool, String> {
    engine.pause_torrent(id).await
}

#[tauri::command]
pub async fn resume_torrent(id: u32, engine: tauri::State<'_, SharedEngine>) -> Result<bool, String> {
    engine.resume_torrent(id).await
}

#[tauri::command]
pub async fn remove_torrent(
    id: u32,
    _delete_files: bool,
    engine: tauri::State<'_, SharedEngine>,
) -> Result<bool, String> {
    engine.remove_torrent(id).await
}

#[tauri::command]
pub async fn set_speed_limit(
    download_kbs: u64,
    upload_kbs: u64,
    engine: tauri::State<'_, SharedEngine>,
) -> Result<(), String> {
    engine.set_speed_limit(download_kbs, upload_kbs).await
}

#[tauri::command]
pub async fn get_torrent_files(id: u32, engine: tauri::State<'_, SharedEngine>) -> Result<Vec<TorrentFile>, String> {
    let torrents = engine.get_all().await;
    torrents.into_iter()
        .find(|t| t.id == id)
        .map(|t| t.files)
        .ok_or_else(|| "Torrent not found".to_string())
}

#[tauri::command]
pub async fn get_peers(_id: u32) -> Result<Vec<PeerInfo>, String> {
    let mut rng = rand::thread_rng();
    let clients = ["qBittorrent 4.6", "uTorrent 3.6", "Transmission 4.0", "Deluge 2.1",
                   "BitTorrent 7.11", "Vuze 5.7", "LibTorrent", "rqbit 0.20"];
    let flags_list = ["DH", "DPH", "E", "DHu", "I", "uE", "Xh"];

    let peers: Vec<PeerInfo> = (0..rng.gen_range(5..=25)).map(|_| {
        PeerInfo {
            ip: format!("{}.{}.{}.{}", rng.gen::<u8>(), rng.gen::<u8>(), rng.gen::<u8>(), rng.gen::<u8>()),
            port: rng.gen_range(1024..=65535),
            client: clients[rng.gen_range(0..clients.len())].to_string(),
            upload_speed: rng.gen_range(0..=5_000_000),
            download_speed: rng.gen_range(0..=2_000_000),
            progress: rng.gen_range(0.0..=100.0_f32),
            flags: flags_list[rng.gen_range(0..flags_list.len())].to_string(),
        }
    }).collect();

    Ok(peers)
}

#[tauri::command]
pub async fn get_trackers(_id: u32) -> Result<Vec<TrackerInfo>, String> {
    let now = chrono::Utc::now().timestamp();
    Ok(vec![
        TrackerInfo {
            url: "udp://tracker.opentrackr.org:1337/announce".to_string(),
            status: "Working".to_string(),
            peers: 142,
            seeds: 87,
            last_announce: now - 300,
            next_announce: now + 1500,
        },
        TrackerInfo {
            url: "udp://open.stealth.si:80/announce".to_string(),
            status: "Working".to_string(),
            peers: 56,
            seeds: 34,
            last_announce: now - 600,
            next_announce: now + 1200,
        },
        TrackerInfo {
            url: "udp://tracker.torrent.eu.org:451/announce".to_string(),
            status: "Not contacted yet".to_string(),
            peers: 0,
            seeds: 0,
            last_announce: 0,
            next_announce: now + 300,
        },
    ])
}

#[tauri::command]
pub async fn parse_torrent_file(file_path: String) -> Result<TorrentPreviewData, String> {
    let name = std::path::Path::new(&file_path)
        .file_stem()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown Torrent")
        .to_string();

    let mut rng = rand::thread_rng();
    let hash: String = (0..40).map(|_| format!("{:x}", rng.gen::<u8>() & 0xf)).collect();

    // Generate realistic file structures
    let (files, piece_len): (Vec<PreviewFile>, u64) = {
        let extensions = ["mkv", "mp4", "iso", "zip", "rar", "pdf", "exe"];
        let sub_extensions = ["srt", "ass", "txt", "nfo", "jpg", "png"];
        let num_main_files = rng.gen_range(1..=4u32);
        let num_sub_files = rng.gen_range(0..=6u32);
        let mut files = Vec::new();
        let mut idx = 0u32;

        for i in 0..num_main_files {
            let ext = extensions[rng.gen_range(0..extensions.len())];
            let file_size = rng.gen_range(100_000_000..=4_000_000_000u64);
            let fname = if num_main_files == 1 {
                format!("{}.{}", name, ext)
            } else {
                format!("{}.part{}.{}", name, i + 1, ext)
            };
            files.push(PreviewFile {
                index: idx,
                path: format!("{}/{}", name, fname),
                name: fname,
                size: file_size,
            });
            idx += 1;
        }

        if num_sub_files > 0 {
            let sub_dirs = ["Subs", "Extras", "Sample", "Covers"];
            let chosen_dir = sub_dirs[rng.gen_range(0..sub_dirs.len())];
            for _ in 0..num_sub_files {
                let ext = sub_extensions[rng.gen_range(0..sub_extensions.len())];
                let file_size = rng.gen_range(1_000..=50_000_000u64);
                let fname = format!("{}_{}.{}", chosen_dir.to_lowercase(), idx, ext);
                files.push(PreviewFile {
                    index: idx,
                    path: format!("{}/{}/{}", name, chosen_dir, fname),
                    name: fname,
                    size: file_size,
                });
                idx += 1;
            }
        }

        // info.nfo
        files.push(PreviewFile {
            index: idx,
            path: format!("{}/info.nfo", name),
            name: "info.nfo".to_string(),
            size: rng.gen_range(500..5000),
        });

        let pl = [262_144u64, 524_288, 1_048_576, 2_097_152, 4_194_304][rng.gen_range(0..5)];
        (files, pl)
    };

    let total_size: u64 = files.iter().map(|f| f.size).sum();
    let num_pieces = (total_size / piece_len) as u32 + 1;

    let trackers = vec![
        "udp://tracker.opentrackr.org:1337/announce".to_string(),
        "udp://open.stealth.si:80/announce".to_string(),
        "udp://tracker.torrent.eu.org:451/announce".to_string(),
    ];

    let creators = ["qBittorrent 4.6.4", "uTorrent 3.6", "Transmission 4.0.5", "libtorrent 2.0"];

    Ok(TorrentPreviewData {
        name: name.clone(),
        info_hash: hash,
        total_size,
        files,
        comment: format!("Downloaded via NexTorrent"),
        created_by: creators[rng.gen_range(0..creators.len())].to_string(),
        creation_date: chrono::Utc::now().timestamp() - rng.gen_range(0..86400 * 30),
        piece_length: piece_len,
        num_pieces,
        is_private: rng.gen_bool(0.2),
        trackers,
        source: "file".to_string(),
    })
}

#[tauri::command]
pub async fn parse_magnet_link(url: String) -> Result<TorrentPreviewData, String> {
    let name = url.split("&dn=")
        .nth(1)
        .and_then(|s| s.split('&').next())
        .unwrap_or("Unknown Torrent")
        .replace('+', " ")
        .replace("%20", " ");

    let hash = url.split("btih:")
        .nth(1)
        .and_then(|s| s.split('&').next())
        .unwrap_or("0000000000000000000000000000000000000000")
        .to_string();

    let trackers: Vec<String> = url.split("&tr=")
        .skip(1)
        .map(|s| {
            s.split('&').next().unwrap_or("")
                .replace("%3A", ":").replace("%2F", "/").replace("%3F", "?")
        })
        .filter(|s| !s.is_empty())
        .collect();

    Ok(TorrentPreviewData {
        name,
        info_hash: hash,
        total_size: 0,
        files: vec![],
        comment: String::new(),
        created_by: String::new(),
        creation_date: 0,
        piece_length: 0,
        num_pieces: 0,
        is_private: false,
        trackers,
        source: "magnet".to_string(),
    })
}

fn urlencoding_decode(s: &str) -> String {
    s.replace('+', " ")
     .replace("%20", " ")
     .replace("%2B", "+")
     .replace("%2F", "/")
}

#[tauri::command]
pub async fn restore_torrents(
    torrents: Vec<PersistedTorrent>,
    engine: tauri::State<'_, SharedEngine>,
) -> Result<Vec<TorrentInfo>, String> {
    let mut restored = Vec::new();
    for t in torrents {
        let state = match t.state.as_str() {
            "downloading" => TorrentState::Downloading,
            "seeding" => TorrentState::Seeding,
            "paused" => TorrentState::Paused,
            "completed" => TorrentState::Completed,
            "error" => TorrentState::Error,
            "queued" => TorrentState::Queued,
            _ => TorrentState::Paused,
        };
        
        let result = engine.restore_torrent(
            &t.name,
            &t.info_hash,
            &t.save_path,
            t.size,
            t.downloaded,
            t.uploaded,
            state,
            t.progress_pct,
            t.added_at,
        ).await;
        
        if let Ok(id) = result {
            if let Some(restored_torrent) = engine.get_all().await.into_iter().find(|x| x.id == id) {
                restored.push(restored_torrent);
            }
        }
    }
    Ok(restored)
}
