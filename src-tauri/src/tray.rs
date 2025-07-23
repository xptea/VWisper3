use tauri::{AppHandle, Runtime};
use tauri::Manager;
use tauri::tray::{TrayIcon, TrayIconBuilder};
use tauri::menu::{MenuBuilder, MenuItemBuilder};

pub fn create_system_tray<R: Runtime>(app: &AppHandle<R>) -> TrayIcon<R> {
    let settings_item = MenuItemBuilder::new("Settings")
        .id("settings")
        .build(app)
        .unwrap();
    let quit_item = MenuItemBuilder::new("Quit")
        .id("quit")
        .build(app)
        .unwrap();
    let menu = MenuBuilder::new(app)
        .item(&settings_item)
        .separator()
        .item(&quit_item)
        .build()
        .unwrap();
    TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event(|app, event| {
            if event.id.0 == "settings" {
                if let Some(window) = app.get_webview_window("settings") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            } else if event.id.0 == "quit" {
                std::process::exit(0);
            }
        })
        .build(app)
        .unwrap()
} 