import React from "react";
import ReactDOM from "react-dom/client";
import AudioPill from "./UI/AudioPill";
import Settings from "./UI/Settings";

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {path === "/settings.html" ? <Settings /> : <AudioPill />}
  </React.StrictMode>,
);
