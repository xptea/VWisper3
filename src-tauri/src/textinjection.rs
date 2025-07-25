use enigo::{Enigo, Key, KeyboardControllable};
use std::thread;
use std::time::Duration;

pub fn inject_text(text: &str) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    {
        return inject_text_via_clipboard(text);
    }
    #[cfg(target_os = "macos")]
    {
        return inject_text_char_by_character(text);
    }
    #[cfg(target_os = "linux")]
    {
        let mut enigo = Enigo::new();
        thread::sleep(Duration::from_millis(50));
        enigo.key_sequence(text);
        thread::sleep(Duration::from_millis(50));
        Ok(())
    }
}

#[cfg(target_os = "windows")]
fn inject_text_via_clipboard(text: &str) -> Result<(), Box<dyn std::error::Error>> {
    use clipboard::{ClipboardProvider, ClipboardContext};
    let mut ctx: ClipboardContext = ClipboardProvider::new()
        .map_err(|e| format!("Failed to initialize clipboard: {}", e))?;
    let original_clipboard = ctx.get_contents().unwrap_or_default();
    let set_clip_result = ctx.set_contents(text.to_string());
    if let Err(e) = set_clip_result {
        let _ = ctx.set_contents(original_clipboard);
        return Err(format!("Failed to set clipboard content: {}", e).into());
    }
    let mut enigo = Enigo::new();
    let focus_delay = Duration::from_millis(100);
    thread::sleep(focus_delay);
    enigo.key_down(Key::Control);
    thread::sleep(Duration::from_millis(20));
    enigo.key_click(Key::Layout('v'));
    thread::sleep(Duration::from_millis(20));
    enigo.key_up(Key::Control);
    thread::sleep(Duration::from_millis(100));
    let _ = ctx.set_contents(original_clipboard);
    Ok(())
}

#[cfg(target_os = "macos")]
fn inject_text_char_by_character(text: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut enigo = Enigo::new();
    for ch in text.chars() {
        match ch {
            '\n' => {
                enigo.key_click(Key::Return);
            }
            '\t' => {
                enigo.key_click(Key::Tab);
            }
            _ => {
                enigo.key_sequence(&ch.to_string());
            }
        }
        thread::sleep(Duration::from_millis(6));
    }
    Ok(())
} 