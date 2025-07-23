use enigo::{Enigo, KeyboardControllable};

pub fn inject_text(text: &str) {
    let mut enigo = Enigo::new();
    enigo.key_sequence(text);
} 