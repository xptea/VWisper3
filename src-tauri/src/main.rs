// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{command, Emitter, Manager, PhysicalPosition};
mod platform {
    #[cfg(target_os = "windows")]
    pub mod windows;
}
mod audio;
mod tray;
mod settings;
mod transcription;
mod textinjection;

pub fn handle_stop_recording_workflow(app: &tauri::AppHandle, restore_focus: Option<Box<dyn FnOnce()>>) -> Result<(), String> {
    audio::stop_recording().map_err(|e| e.to_string())?;
    
    let settings = settings::get_settings().map_err(|e| e.to_string())?;
    let api_key = settings.groq_api_key.ok_or("No Groq API key set")?;
    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join("vwisper_audio_latest.wav");
    
    let text = transcription::transcribe_audio(file_path.to_str().unwrap(), &api_key)?;
    
    let _ = app.emit_to("main", "transcription-result", &text);
    
    textinjection::inject_text(&text, restore_focus);
    
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .on_window_event(|window, event| {
            if window.label() == "dashboard" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    window.hide().unwrap();
                    api.prevent_close();
                }
            }
        })
        .setup(|app| {
            let _tray = tray::create_system_tray(&app.handle());
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
            stop_audio_recording,
            settings::get_settings,
            settings::save_settings,
            settings::reset_settings,
            settings::get_settings_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[command]
fn start_audio_recording() -> Result<(), String> {
    audio::start_recording().map_err(|e| e.to_string())
}

#[command]
fn stop_audio_recording(app: tauri::AppHandle) -> Result<(), String> {
    handle_stop_recording_workflow(&app, None)
}
