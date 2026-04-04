use crate::torrent::{SharedEngine, TorrentInfo, GlobalStats, TorrentFile, PeerInfo, TrackerInfo, TorrentState, PreviewFile, TorrentPreviewData};
use crate::settings::{AppSettings, load_settings, save_settings};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

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
    engine.add_magnet(&url, &save_path, None).await
}

#[tauri::command]
pub async fn add_torrent_file(
    file_path: String,
    save_path: String,
    engine: tauri::State<'_, SharedEngine>,
) -> Result<u32, String> {
    engine.add_torrent_from_file(&file_path, &save_path, None).await
}

#[tauri::command]
pub async fn start_torrent(
    source: String,
    path_or_url: String,
    save_path: String,
    selected_indices: Vec<u32>,
    engine: tauri::State<'_, SharedEngine>,
) -> Result<u32, String> {
    if source == "magnet" {
        engine.add_magnet(&path_or_url, &save_path, Some(selected_indices)).await
    } else {
        engine.add_torrent_from_file(&path_or_url, &save_path, Some(selected_indices)).await
    }
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
    delete_files: bool,
    engine: tauri::State<'_, SharedEngine>,
) -> Result<bool, String> {
    engine.remove_torrent(id, delete_files).await
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
pub async fn get_peers(id: u32, engine: tauri::State<'_, SharedEngine>) -> Result<Vec<PeerInfo>, String> {
    engine.get_peers(id).await
}

#[tauri::command]
pub async fn get_trackers(id: u32, engine: tauri::State<'_, SharedEngine>) -> Result<Vec<TrackerInfo>, String> {
    engine.get_trackers(id).await
}

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    Ok(load_settings(&app))
}

#[tauri::command]
pub async fn update_settings(app: AppHandle, settings: AppSettings, engine: tauri::State<'_, SharedEngine>) -> Result<(), String> {
    save_settings(&app, &settings)?;
    let _ = engine.set_speed_limit(settings.download_limit_kbs as u64, settings.upload_limit_kbs as u64).await;
    let _ = engine.set_app_options(settings.stop_seed_on_complete, settings.anonymous_download).await;
    Ok(())
}

#[tauri::command]
pub async fn parse_torrent_file(file_path: String) -> Result<TorrentPreviewData, String> {
    use librqbit_core::torrent_metainfo::{TorrentMetaV1Owned, torrent_from_bytes};

    let bytes = std::fs::read(&file_path).map_err(|e| format!("Cannot read file: {e}"))?;
    let torrent: TorrentMetaV1Owned = torrent_from_bytes(&bytes)
        .map_err(|e| format!("Invalid torrent: {e}"))?;

    let name = torrent.info.name
        .as_ref()
        .and_then(|b| std::str::from_utf8(b.as_ref()).ok())
        .unwrap_or("Unknown Torrent")
        .to_string();

    let info_hash = torrent.info_hash.as_string();
    let piece_length = torrent.info.piece_length as u64;

    // Build file list using iter_file_details
    let files: Vec<PreviewFile> = {
        let details = torrent.info.iter_file_details()
            .map_err(|e| format!("File details error: {e}"))?;
        details.enumerate().map(|(i, f)| {
            let file_name = f.filename.to_string()
                .unwrap_or_else(|_| format!("file_{i}"));
            let size = f.len;
            PreviewFile {
                index: i as u32,
                path: format!("{}/{}", name, file_name),
                name: file_name.split('/').last().unwrap_or(&file_name).to_string(),
                size,
            }
        }).collect()
    };

    let total_size: u64 = files.iter().map(|f| f.size).sum();
    let num_pieces = if piece_length > 0 {
        total_size.div_ceil(piece_length) as u32
    } else {
        0
    };

    // Trackers from announce + announce-list
    let trackers: Vec<String> = torrent.iter_announce()
        .filter_map(|b| std::str::from_utf8(b.as_ref()).ok().map(|s| s.to_string()))
        .collect();

    let comment = torrent.comment
        .as_ref()
        .and_then(|b| std::str::from_utf8(b.as_ref()).ok())
        .unwrap_or("")
        .to_string();

    let created_by = torrent.created_by
        .as_ref()
        .and_then(|b| std::str::from_utf8(b.as_ref()).ok())
        .unwrap_or("")
        .to_string();

    let creation_date = torrent.creation_date.unwrap_or(0) as i64;
    let is_private = torrent.info.private;

    Ok(TorrentPreviewData {
        name,
        info_hash,
        total_size,
        files,
        comment,
        created_by,
        creation_date,
        piece_length,
        num_pieces,
        is_private,
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
