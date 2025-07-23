use std::thread;
use std::time::{Duration, Instant};
use device_query::{DeviceState, Keycode, DeviceQuery};
use tauri::{AppHandle, Emitter, Manager};
use crate::audio;
use crate::handle_stop_recording_workflow;

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SetForegroundWindow};

#[cfg(target_os = "windows")]
fn store_and_restore_previous_window() -> Option<windows::Win32::Foundation::HWND> {
    unsafe {
        let previous_window = GetForegroundWindow();
        if previous_window.0 != 0 {
            Some(previous_window)
        } else {
            None
        }
    }
}

#[cfg(target_os = "windows")]
fn restore_window_focus(window_handle: windows::Win32::Foundation::HWND) {
    unsafe {
        let _ = SetForegroundWindow(window_handle);
    }
}

#[cfg(not(target_os = "windows"))]
fn store_and_restore_previous_window() -> Option<()> {
    None
}

#[cfg(not(target_os = "windows"))]
fn restore_window_focus(_window_handle: ()) {
    // No-op on non-Windows
}

pub fn start_global_key_monitor(app_handle: AppHandle) {
    thread::spawn(move || {
        let device_state = DeviceState::new();
        let mut last_control_state = false;
        let mut last_action_time = Instant::now();
        let mut previous_window: Option<windows::Win32::Foundation::HWND> = None;

        loop {
            let keys = device_state.get_keys();
            let control_pressed = keys.contains(&Keycode::RControl);
            let now = Instant::now();

            if control_pressed && !last_control_state && now.duration_since(last_action_time) > Duration::from_millis(25) {
                last_action_time = now;
                previous_window = store_and_restore_previous_window();
                println!("[VWisper] Stored previous window for focus restoration");
                
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                let _ = app_handle.emit_to("main", "pill-state", "listening");
                let _ = app_handle.emit_to("main", "start-recording", "");
                println!("[VWisper] Right Ctrl pressed: starting audio recording");
                let _ = audio::start_recording();
            }
            if !control_pressed && last_control_state && now.duration_since(last_action_time) > Duration::from_millis(25) {
                last_action_time = now;
                let workflow_start_time = Instant::now();
                println!("[VWisper] Right Ctrl released at {:?}: stopping audio recording and running workflow", workflow_start_time);
                let _ = app_handle.emit_to("main", "pill-state", "loading");
                let _ = app_handle.emit_to("main", "stop-recording", "");
                
                let app_handle_clone = app_handle.clone();
                let previous_window_clone = previous_window;
                
                thread::spawn(move || {
                    println!("[VWisper] About to call handle_stop_recording_workflow");
                    
                    let restore_focus = if let Some(window) = previous_window_clone {
                        Some(Box::new(move || {
                            println!("[VWisper] Restoring focus to previous window");
                            restore_window_focus(window);
                        }) as Box<dyn FnOnce()>)
                    } else {
                        None
                    };
                    
                    let result = handle_stop_recording_workflow(&app_handle_clone, restore_focus);
                    let workflow_end_time = Instant::now();
                    println!("[VWisper] handle_stop_recording_workflow completed after {:?}", workflow_end_time.duration_since(workflow_start_time));
                    
                    if let Err(e) = result {
                        println!("[VWisper] ERROR in handle_stop_recording_workflow: {}", e);
                    }
                    
                    let _ = app_handle_clone.emit_to("main", "pill-state", "idle");
                    if let Some(window) = app_handle_clone.get_webview_window("main") {
                        let _ = window.hide();
                    }
                });
                
                previous_window = None;
            }
            last_control_state = control_pressed;
            thread::sleep(Duration::from_millis(15));
        }
    });
} 