use std::thread;
use std::time::{Duration, Instant};
use device_query::{DeviceState, Keycode, DeviceQuery};
use tauri::{AppHandle, Emitter, Manager};
use crate::audio;
use crate::handle_stop_recording_workflow;

#[cfg(target_os = "macos")]
use core_graphics::window::{CGWindowListCopyWindowInfo, kCGWindowListOptionOnScreenOnly, kCGNullWindowID};

pub fn start_global_key_monitor(app_handle: AppHandle) {
    thread::spawn(move || {
        let device_state = DeviceState::new();
        let mut last_control_state = false;
        let mut last_action_time = Instant::now();
        let mut active_window_info: Option<String> = None;
        
        loop {
            let keys = device_state.get_keys();
            let control_pressed = keys.contains(&Keycode::LControl) || keys.contains(&Keycode::RControl);
            let now = Instant::now();
            
            if control_pressed && !last_control_state && now.duration_since(last_action_time) > Duration::from_millis(25) {
                last_action_time = now;
                
                // Capture the currently active window info before showing our window
                #[cfg(target_os = "macos")]
                {
                    unsafe {
                        let window_list = CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly, kCGNullWindowID);
                        if let Some(window_info) = window_list {
                            // Get the frontmost window (first in the list)
                            if let Some(first_window) = window_info.get(0) {
                                if let Some(name) = first_window.name() {
                                    active_window_info = Some(name.to_string());
                                }
                            }
                        }
                    }
                }
                
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                }
                let _ = app_handle.emit_to("main", "pill-state", "listening");
                let _ = app_handle.emit_to("main", "start-recording", "");
                let _ = audio::start_recording();
            }
            
            if !control_pressed && last_control_state && now.duration_since(last_action_time) > Duration::from_millis(25) {
                last_action_time = now;
                let _ = app_handle.emit_to("main", "pill-state", "loading");
                let _ = app_handle.emit_to("main", "stop-recording", "");
                
                let app_handle_clone = app_handle.clone();
                let window_name_to_restore = active_window_info.clone();
                
                thread::spawn(move || {
                    let result = handle_stop_recording_workflow(&app_handle_clone, Some(Box::new(move || {
                        // Restore focus to the original window using AppleScript
                        #[cfg(target_os = "macos")]
                        if let Some(window_name) = window_name_to_restore {
                            let script = format!(
                                "tell application \"System Events\" to set frontmost of process \"{}\" to true",
                                window_name
                            );
                            let _ = std::process::Command::new("osascript")
                                .arg("-e")
                                .arg(&script)
                                .output();
                        }
                    })));
                    
                    if let Err(e) = result {
                        eprintln!("Error in handle_stop_recording_workflow: {}", e);
                        let _ = app_handle_clone.emit_to("main", "pill-state", "error");
                        thread::sleep(Duration::from_secs(3));
                    } else {
                        let _ = app_handle_clone.emit_to("main", "pill-state", "success");
                        thread::sleep(Duration::from_millis(500));
                    }
                    let _ = app_handle_clone.emit_to("main", "pill-state", "idle");
                    if let Some(window) = app_handle_clone.get_webview_window("main") {
                        let _ = window.hide();
                    }
                });
            }
            last_control_state = control_pressed;
            thread::sleep(Duration::from_millis(15));
        }
    });
} 