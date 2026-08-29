"use client";

import { useEffect, useState } from "react";

export default function IssuesPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/issues")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setRecords(data.records || []);
        }
        setLoading(false);
      });
  }, []);

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
      <a href="/dashboard" style={{ fontSize: 14, color: "#555" }}>
        ← Dashboard
      </a>
      <h1 style={{ fontSize: 22, marginTop: 8, marginBottom: 20 }}>Issues Log</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#c00" }}>{error}</p>}
      {!loading && !error && records.length === 0 && (
        <p style={{ color: "#666" }}>No issues logged yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {records.map((record) => (
          <div
            key={record.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            {Object.entries(record.fields).map(([key, value]) => (
              <div key={key} style={{ fontSize: 14, marginBottom: 2 }}>
                <span style={{ fontWeight: 600 }}>{key}:</span>{" "}
                <span style={{ color: "#333" }}>{String(value)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
