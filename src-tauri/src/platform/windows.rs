use std::thread;
use std::time::{Duration, Instant};
use device_query::{DeviceState, Keycode, DeviceQuery};
use tauri::{AppHandle, Emitter, Manager};

pub fn start_global_key_monitor(app_handle: AppHandle) {
    thread::spawn(move || {
        let device_state = DeviceState::new();
        let mut last_control_state = false;
        let mut last_action_time = Instant::now();
        let mut loading_until: Option<Instant> = None;

        loop {
            let keys = device_state.get_keys();
            let control_pressed = keys.contains(&Keycode::RControl);
            let now = Instant::now();

            if let Some(until) = loading_until {
                if now >= until {
                    let _ = app_handle.emit_to("main", "pill-state", "idle");
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.hide();
                    }
                    loading_until = None;
                    last_control_state = false;
                }
                thread::sleep(Duration::from_millis(15));
                continue;
            }

            if control_pressed && !last_control_state && now.duration_since(last_action_time) > Duration::from_millis(25) {
                last_action_time = now;
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                let _ = app_handle.emit_to("main", "pill-state", "listening");
                let _ = app_handle.emit_to("main", "start-recording", "");
            }
            if !control_pressed && last_control_state && now.duration_since(last_action_time) > Duration::from_millis(25) {
                last_action_time = now;
                let _ = app_handle.emit_to("main", "pill-state", "loading");
                let _ = app_handle.emit_to("main", "stop-recording", "");
                loading_until = Some(now + Duration::from_secs(5));
            }
            last_control_state = control_pressed;
            thread::sleep(Duration::from_millis(15));
        }
    });
} 