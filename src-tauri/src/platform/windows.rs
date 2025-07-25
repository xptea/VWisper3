use std::thread;
use std::time::{Duration, Instant};
use device_query::{DeviceState, Keycode, DeviceQuery};
use tauri::{AppHandle, Emitter, Manager};
use crate::audio;
use crate::handle_stop_recording_workflow;

pub fn start_global_key_monitor(app_handle: AppHandle) {
    thread::spawn(move || {
        let device_state = DeviceState::new();
        let mut last_control_state = false;
        let mut last_action_time = Instant::now();
        loop {
            let keys = device_state.get_keys();
            let control_pressed = keys.contains(&Keycode::RControl);
            let now = Instant::now();
            if control_pressed && !last_control_state && now.duration_since(last_action_time) > Duration::from_millis(25) {
                last_action_time = now;
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
                thread::spawn(move || {
                    let result = handle_stop_recording_workflow(&app_handle_clone, None);
                    if let Err(e) = result {
                        eprintln!("Error in handle_stop_recording_workflow: {}", e);
                        let _ = app_handle_clone.emit_to("main", "pill-state", "error");
                        // Keep error state visible for 3 seconds before hiding
                        thread::sleep(Duration::from_secs(3));
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