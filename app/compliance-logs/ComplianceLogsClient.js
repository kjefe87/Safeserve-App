"use client";

import { useEffect, useState } from "react";
import { api, fmtDateTime, ui } from "@/lib/ui";

export default function ComplianceLogsClient() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/compliance-logs")
      .then((d) => setLogs(d.logs))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cell = { padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "left", fontSize: 14 };

  return (
    <main style={{ ...ui.page, maxWidth: 900 }}>
      <a href="/dashboard" style={ui.back}>← Dashboard</a>
      <h1 style={ui.h1}>Compliance Logs</h1>
      <p style={ui.muted}>Audit trail of completed checklist tasks (most recent 300).</p>
      {error && <p style={ui.error}>{error}</p>}
      {loading ? <p>Loading...</p> : logs.length === 0 ? <p style={ui.muted}>No entries yet.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead>
              <tr>
                <th style={cell}>#</th><th style={cell}>Task</th><th style={cell}>Completed by</th>
                <th style={cell}>When</th><th style={cell}>Status</th><th style={cell}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={cell}>{l.logId}</td>
                  <td style={cell}>{l.taskName}</td>
                  <td style={cell}>{l.completedBy}</td>
                  <td style={cell}>{fmtDateTime(l.dateCompleted)}</td>
                  <td style={cell}>{l.status}</td>
                  <td style={cell}>{l.notes}{l.temperatureReading != null ? ` (${l.temperatureReading}°F)` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
