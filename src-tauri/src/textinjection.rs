use enigo::{Enigo, KeyboardControllable};
use std::time::{Duration, Instant};
use std::thread;

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};

#[cfg(target_os = "windows")]
fn get_foreground_window_title() -> String {
    unsafe {
        let hwnd = GetForegroundWindow();
        let mut title = [0u16; 256];
        let len = GetWindowTextW(hwnd, &mut title);
        if len > 0 {
            String::from_utf16_lossy(&title[..len as usize])
        } else {
            "Unknown Window".to_string()
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn get_foreground_window_title() -> String {
    "Not Windows".to_string()
}

pub fn inject_text(text: &str, restore_focus: Option<Box<dyn FnOnce()>>) {
    println!("[VWisper] TextInjection: Starting text injection");
    println!("[VWisper] TextInjection: Text to inject: '{}'", text);
    println!("[VWisper] TextInjection: Text length: {} characters", text.len());
    
    let start_time = Instant::now();
    
    let foreground_window = get_foreground_window_title();
    println!("[VWisper] TextInjection: Current foreground window: '{}'", foreground_window);
    
    if let Some(restore_fn) = restore_focus {
        println!("[VWisper] TextInjection: Restoring focus to previous window");
        restore_fn();
        thread::sleep(Duration::from_millis(50));
    }
    
    let foreground_window_after_focus = get_foreground_window_title();
    println!("[VWisper] TextInjection: Foreground window after focus restore: '{}'", foreground_window_after_focus);
    
    let mut enigo = Enigo::new();
    println!("[VWisper] TextInjection: Enigo instance created");
    
    let before_injection = Instant::now();
    println!("[VWisper] TextInjection: About to inject text at {:?}", before_injection);
    
    enigo.key_sequence(text);
    
    let after_injection = Instant::now();
    let injection_duration = after_injection.duration_since(before_injection);
    
    println!("[VWisper] TextInjection: Text injection completed");
    println!("[VWisper] TextInjection: Injection took {:?}", injection_duration);
    println!("[VWisper] TextInjection: Total function time: {:?}", start_time.elapsed());
    
    if injection_duration < Duration::from_millis(10) {
        println!("[VWisper] TextInjection: WARNING - Injection was very fast, might indicate no active text field");
        println!("[VWisper] TextInjection: This could mean the user clicked away from the text field");
        
        println!("[VWisper] TextInjection: Trying alternative injection method...");
        thread::sleep(Duration::from_millis(50));
        
        let mut enigo2 = Enigo::new();
        enigo2.key_sequence(text);
        
        let retry_duration = Instant::now().duration_since(after_injection);
        println!("[VWisper] TextInjection: Retry injection took {:?}", retry_duration);
    }
    
    if injection_duration > Duration::from_millis(1000) {
        println!("[VWisper] TextInjection: WARNING - Injection took a long time, might indicate system lag");
    }
    
    println!("[VWisper] TextInjection: Function completed successfully");
} 