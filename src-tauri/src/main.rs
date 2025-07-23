// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, PhysicalPosition, command};
mod platform {
    #[cfg(target_os = "windows")]
    pub mod windows;
}
mod audio;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                if let Some(monitor) = window.current_monitor().unwrap() {
                    let monitor_size = monitor.size();
                    let window_size = window.outer_size().unwrap();
                    let padding = 80;
                    let x = (monitor_size.width / 2).saturating_sub(window_size.width / 2);
                    let y = monitor_size.height.saturating_sub(window_size.height + padding);
                    let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
                }
            }
            
            let app_handle = app.handle().clone();
            audio::start_audio_capture(app_handle);
            
            #[cfg(target_os = "windows")]
            {
                let app_handle = app.handle().clone();
                platform::windows::start_global_key_monitor(app_handle);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_audio_recording,
            stop_audio_recording
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

#[command]
fn start_audio_recording() -> Result<(), String> {
    audio::start_recording().map_err(|e| e.to_string())
}

#[command]
fn stop_audio_recording() -> Result<(), String> {
    audio::stop_recording().map_err(|e| e.to_string())
}
}
