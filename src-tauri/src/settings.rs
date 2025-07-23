use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use dirs::config_dir;
use tauri::command;

#[derive(Serialize, Deserialize, Default)]
pub struct Settings {
    pub groq_api_key: Option<String>,
}

fn settings_path() -> PathBuf {
    let mut path = config_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("vwisper");
    fs::create_dir_all(&path).ok();
    path.push("settings.json");
    path
}

fn load_settings() -> Settings {
    let path = settings_path();
    if let Ok(data) = fs::read_to_string(path) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        Settings::default()
    }
}

fn save_settings_to_file(settings: &Settings) -> Result<(), String> {
    let path = settings_path();
    let data = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}

#[command]
pub fn get_settings() -> Result<Settings, String> {
    Ok(load_settings())
}

#[command]
pub fn save_settings(groq_api_key: String) -> Result<(), String> {
    let mut settings = load_settings();
    settings.groq_api_key = Some(groq_api_key);
    save_settings_to_file(&settings)
}

#[command]
pub fn reset_settings() -> Result<(), String> {
    let mut settings = load_settings();
    settings.groq_api_key = None;
    save_settings_to_file(&settings)
}

#[command]
pub fn get_settings_path() -> Result<String, String> {
    Ok(settings_path().to_string_lossy().to_string())
}
