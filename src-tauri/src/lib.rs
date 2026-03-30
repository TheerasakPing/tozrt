mod torrent;
mod commands;
mod settings;

use torrent::{SharedEngine, LibrqbitEngine, MockEngine};
use commands::*;
use tauri::{Emitter, Manager};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::interval;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .setup(move |app| {
            let handle = app.handle().clone();
            let settings = settings::load_settings(&handle);
            let dl = settings.download_limit_kbs as u64;
            let ul = settings.upload_limit_kbs as u64;
            let stop_seed = settings.stop_seed_on_complete;
            let download_path = settings.download_path.clone();
            let listen_port = settings.port.max(1024);
            let persistence_dir = handle
                .path()
                .app_data_dir()
                .map(|dir| dir.join("librqbit-session"))
                .ok();

            // Prefer the real engine. If persistence cannot be enabled, fall back to
            // a real ephemeral session before resorting to the mock engine.
            let engine: SharedEngine = tauri::async_runtime::block_on(async move {
                match match persistence_dir {
                    Some(persistence_dir) => LibrqbitEngine::new(&download_path, listen_port, &persistence_dir).await,
                    None => Err("Could not resolve app data directory for librqbit persistence".to_string()),
                } {
                    Ok(e) => {
                        let eng = Arc::new(e) as SharedEngine;
                        let _ = eng.set_speed_limit(dl, ul).await;
                        let _ = eng.set_app_options(stop_seed).await;
                        tracing::info!("✅ LibrqbitEngine initialised (real downloads)");
                        eng
                    }
                    Err(err) => match LibrqbitEngine::new_ephemeral(&download_path, listen_port).await {
                        Ok(e) => {
                            let eng = Arc::new(e) as SharedEngine;
                            let _ = eng.set_speed_limit(dl, ul).await;
                            let _ = eng.set_app_options(stop_seed).await;
                            tracing::warn!("⚠️  LibrqbitEngine persistence failed ({err}), using ephemeral real session");
                            eng
                        }
                        Err(ephemeral_err) => {
                            tracing::warn!(
                                "⚠️  LibrqbitEngine failed ({err}); ephemeral fallback failed ({ephemeral_err}), using MockEngine"
                            );
                            let eng = Arc::new(MockEngine::new()) as SharedEngine;
                            let _ = eng.set_speed_limit(dl, ul).await;
                            let _ = eng.set_app_options(stop_seed).await;
                            eng
                        }
                    }
                }
            });

            let eng_loop = engine.clone();
            app.manage(engine);

            // Background loop: push updates to frontend every 500 ms
            tauri::async_runtime::spawn(async move {
                let mut ticker = interval(Duration::from_millis(500));
                loop {
                    ticker.tick().await;
                    eng_loop.simulate_step().await;
                    let torrents = eng_loop.get_all().await;
                    let stats   = eng_loop.get_stats().await;
                    let _ = handle.emit("torrent:update", &torrents);
                    let _ = handle.emit("stats:update",   &stats);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_torrents,
            get_stats,
            add_magnet,
            add_torrent_file,
            start_torrent,
            pause_torrent,
            resume_torrent,
            remove_torrent,
            set_speed_limit,
            get_torrent_files,
            get_peers,
            get_trackers,
            get_settings,
            update_settings,
            parse_torrent_file,
            parse_magnet_link,
            restore_torrents,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NexTorrent");
}
