use enigo::{Enigo, KeyboardControllable};
use arboard::Clipboard;

pub fn inject_text(text: &str, restore_focus: Option<Box<dyn FnOnce()>>) {
    if let Some(restore_fn) = restore_focus {
        restore_fn();
    }
    
    let mut enigo = Enigo::new();
    let mut clipboard = Clipboard::new().unwrap();
    
    let _ = clipboard.set_text(text);
    
    #[cfg(target_os = "macos")]
    {
        enigo.key_down(enigo::Key::Meta);
        enigo.key_click(enigo::Key::Layout('v'));
        enigo.key_up(enigo::Key::Meta);
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        enigo.key_down(enigo::Key::Control);
        enigo.key_click(enigo::Key::Layout('v'));
        enigo.key_up(enigo::Key::Control);
    }
} 