import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const INTEGRITY_SERVER_URL = "http://localhost:4000";
const INTEGRITY_WS_URL = "ws://localhost:4000";

function App() {
  const [file, setFile] = useState(null);
  const [log, setLog] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(INTEGRITY_WS_URL);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      addLog({ event: "ws", msg: "WebSocket connected" });
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog(data);
    };

    ws.current.onclose = () => {
      addLog({ event: "ws", msg: "WebSocket disconnected" });
    };

    return () => ws.current.close();
  }, []);

  const addLog = (entry) => {
    setLog((prev) => [...prev, entry]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${INTEGRITY_SERVER_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      addLog({ event: "upload", msg: json.message });
    } catch (err) {
      console.error(err);
      addLog({ event: "error", msg: "Upload failed" });
    }
  };

  return (
    <div className="app">
      <h1>🎵 Song Publisher</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".wav"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit">Upload</button>
      </form>

      <div className="log">
        <h2>Status Log</h2>
        <ul>
          {log.map((entry, idx) => (
            <li key={idx}>
              <strong>{entry.event}</strong>: {entry.msg}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
