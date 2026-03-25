mod torrent;
mod commands;

use torrent::create_engine;
use commands::*;
use tauri::Emitter;
use std::time::Duration;
use tokio::time::interval;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let engine = create_engine();
    let engine_clone = engine.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .manage(engine)
        .setup(move |app| {
            let handle = app.handle().clone();
            let eng = engine_clone.clone();

            // Background task: simulate torrent progress and emit events every 500ms
            tauri::async_runtime::spawn(async move {
                let mut ticker = interval(Duration::from_millis(500));
                loop {
                    ticker.tick().await;

                    eng.simulate_step().await;
                    let torrents = eng.get_all().await;
                    let stats = eng.get_stats().await;

                    // Emit torrent list update
                    let _ = handle.emit("torrent:update", &torrents);
                    // Emit global stats
                    let _ = handle.emit("stats:update", &stats);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_torrents,
            get_stats,
            add_magnet,
            add_torrent_file,
            pause_torrent,
            resume_torrent,
            remove_torrent,
            set_speed_limit,
            get_torrent_files,
            get_peers,
            get_trackers,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NexTorrent");
}
