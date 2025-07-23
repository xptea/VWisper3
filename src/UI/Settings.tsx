import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [inputType, setInputType] = useState("text");
  const [settingsPath, setSettingsPath] = useState<string | null>(null);

  useEffect(() => {
    invoke("get_settings").then((settings: any) => {
      setApiKey(settings.groq_api_key || "");
      setLoading(false);
    });
    invoke("get_settings_path").then((path) => {
      setSettingsPath(path as string);
    });
  }, []);

  const handleSave = async () => {
    setSaved(false);
    await invoke("save_settings", { groqApiKey: apiKey });
    setSaved(true);
    setInputType("password");
  };

  const handleReset = async () => {
    setSaved(false);
    await invoke("reset_settings");
    setApiKey("");
    setSaved(true);
    setInputType("text");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setInputType("text");
    setSaved(false);
  };

  if (loading) return <div>Loading...</div>;

  const directoryPath = settingsPath ? settingsPath.substring(0, settingsPath.lastIndexOf("/")) : null;

  return (
    <div style={{ padding: 32, maxWidth: 400, margin: "0 auto" }}>
      <h2>Groq API Key</h2>
      <input
        type={inputType}
        value={apiKey}
        onChange={handleInputChange}
        placeholder="Enter your Groq API key"
        style={{ width: "100%", padding: 8, fontSize: 16, marginBottom: 16 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} style={{ flex: 1, padding: 10, fontSize: 16 }}>
          Save
        </button>
        <button onClick={handleReset} style={{ flex: 1, padding: 10, fontSize: 16 }}>
          Reset
        </button>
      </div>
      {saved && <div style={{ marginTop: 16, color: "green" }}>Saved!</div>}
      <div style={{ marginTop: 16, color: "#555", fontSize: 14 }}>
        Your API key is securely saved in the app's local settings file.<br />
        {settingsPath && (
          <>
            <span>File Path: <span style={{ fontFamily: 'monospace' }}>{settingsPath}</span></span><br />
            <span>Directory: <span style={{ fontFamily: 'monospace' }}>{directoryPath}</span></span>
          </>
        )}
      </div>
    </div>
  );
}
