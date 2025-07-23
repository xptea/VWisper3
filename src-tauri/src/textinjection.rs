use enigo::{Enigo, KeyboardControllable};

pub fn inject_text(text: &str, restore_focus: Option<Box<dyn FnOnce()>>) {
    if let Some(restore_fn) = restore_focus {
        restore_fn();
    }
    
    let mut enigo = Enigo::new();
    enigo.key_sequence(text);
} 