import React, { useState, useEffect, useRef } from "react";
import axios from "axios"; // Import axios
import "./App.css";

const INTEGRITY_SERVER_URL = "http://localhost:4000";
const INTEGRITY_WS_URL = "ws://localhost:4000";
const MAIN_SERVER_URL = "http://localhost:3000";

function App() {
  const [file, setFile] = useState(null);
  const [log, setLog] = useState([]);
  const [refId, setRefId] = useState(null);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [formData, setFormData] = useState({
    artistName: "",
    trackName: ""
  });
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(INTEGRITY_WS_URL);

    ws.current.onopen = () => {
      addLog({ event: "ws", msg: "WebSocket connected" });
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog(data);
      
      if (data.refId) {
        setRefId(data.refId);
        setShowMetadataForm(true);
      }
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

    setRefId(null);
    setShowMetadataForm(false);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Using axios instead of fetch
      const res = await axios.post(`${INTEGRITY_SERVER_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      addLog({ event: "upload", msg: res.data.message });
    } catch (err) {
      console.error(err);
      addLog({ event: "error", msg: "Upload failed" });
    }
  };

  const handleMetadataSubmit = async (e) => {
    e.preventDefault();
    try {
      // Using axios instead of fetch
      const response = await axios.post(`${MAIN_SERVER_URL}/metadata`, {
        refId,
        artistName: formData.artistName,
        trackName: formData.trackName
      });
      
      addLog({ event: "metadata", msg: "Metadata submitted successfully" });
      setShowMetadataForm(false);
    } catch (error) {
      console.error("Error submitting metadata:", error);
      addLog({ event: "error", msg: "Failed to submit metadata" });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="app">
      <h1>🎵 Song Publisher</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".wav,.mp3"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit">Upload</button>
      </form>

      {showMetadataForm && (
        <div className="metadata-form">
          <h3>Add Track Metadata</h3>
          <form onSubmit={handleMetadataSubmit}>
            <div className="form-group">
              <label>Artist Name:</label>
              <input
                type="text"
                name="artistName"
                value={formData.artistName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Track Name:</label>
              <input
                type="text"
                name="trackName"
                value={formData.trackName}
                onChange={handleInputChange}
                required
              />
            </div>
            <button type="submit">Submit Metadata</button>
          </form>
        </div>
      )}

      <div className="log">
        <h2>Status Log</h2>
        <ul>
          {log.map((entry, idx) => (
            <li key={idx} className={entry.event}>
              <strong>{entry.event}</strong>: {entry.msg}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;