use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BandwidthSchedule {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub download_kbs: u32,
    pub upload_kbs: u32,
    pub days: Vec<u8>,
    pub start_hour: u8,
    pub end_hour: u8,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub download_path: String,
    pub download_limit_kbs: u32,
    pub upload_limit_kbs: u32,
    pub port: u16,
    pub dht_enabled: bool,
    pub pex_enabled: bool,
    pub encryption: String,
    pub max_connections: u32,
    pub accent_color: String,
    pub animations: bool,
    pub theme: String,
    pub queue_mode: String,
    pub max_active_downloads: u32,
    pub notifications_enabled: bool,
    pub check_duplicates: bool,
    pub bandwidth_schedules: Vec<BandwidthSchedule>,
}

impl Default for AppSettings {
    fn default() -> Self {
        let download_path = dirs::download_dir()
            .unwrap_or_else(|| PathBuf::from("Downloads"))
            .to_string_lossy()
            .to_string();

        Self {
            download_path,
            download_limit_kbs: 0,
            upload_limit_kbs: 0,
            port: 51413,
            dht_enabled: true,
            pex_enabled: true,
            encryption: "enabled".to_string(),
            max_connections: 200,
            accent_color: "cyan".to_string(),
            animations: true,
            theme: "dark".to_string(),
            queue_mode: "parallel".to_string(),
            max_active_downloads: 3,
            notifications_enabled: true,
            check_duplicates: true,
            bandwidth_schedules: Vec::new(),
        }
    }
}

pub fn get_settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }

    Ok(config_dir.join("settings.json"))
}

pub fn load_settings(app: &AppHandle) -> AppSettings {
    if let Ok(path) = get_settings_path(app) {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(settings) = serde_json::from_str::<AppSettings>(&content) {
                    return settings;
                }
            }
        }
    }
    AppSettings::default()
}

pub fn save_settings(app: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = get_settings_path(app)?;
    let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}
