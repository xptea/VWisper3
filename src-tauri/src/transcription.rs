use std::fs::File;
use std::io::Read;
use reqwest::blocking::Client;
use serde_json::Value;

pub fn transcribe_audio(file_path: &str, api_key: &str) -> Result<String, String> {
    let mut file = File::open(file_path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

    let client = Client::new();
    let url = "https://api.groq.com/openai/v1/audio/transcriptions";
    let form = reqwest::blocking::multipart::Form::new()
        .file("file", file_path).map_err(|e| e.to_string())?
        .text("model", "distil-whisper-large-v3-en")
        .text("response_format", "json");

    let resp = client.post(url)
        .multipart(form)
        .bearer_auth(api_key)
        .send()
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    let text = resp.text().map_err(|e| e.to_string())?;
    
    if !status.is_success() {
        return Err(format!("Groq API error: {} - {}", status, text));
    }
    
    let v: Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    Ok(v["text"].as_str().unwrap_or("").to_string())
} 