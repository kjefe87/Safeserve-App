"use client";

import { Fragment, useEffect, useState } from "react";
import { recordTitle } from "@/lib/format";

export default function TempLogsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/temp-logs")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setRecords(data.records || []);
        setLoading(false);
      });
  }, []);

  return (
    <main className="page-shell" style={{ "--page-accent": "#1D6FA5" }}>
      <a href="/dashboard" className="back-link">
        ← Dashboard
      </a>
      <span className="eyebrow">Cold-chain &amp; equipment readings</span>
      <h1 className="page-title">Temperature Logs</h1>

      {loading && <p className="state-message">Loading temperature logs…</p>}
      {error && <p className="state-message is-error">{error}</p>}
      {!loading && !error && records.length === 0 && (
        <div className="empty-state">
          No temperature logs recorded yet. Readings from fridges, freezers,
          and hot-holding will show up here.
        </div>
      )}

      <div className="record-list">
        {records.map((record, i) => (
          <div key={record.id} className="record-card">
            <div className="record-title">{recordTitle(record.fields, i)}</div>
            <div className="field-grid">
              {Object.entries(record.fields).map(([key, value]) => (
                <Fragment key={key}>
                  <span className="field-label">{key}</span>
                  <span className="field-value">{String(value)}</span>
                </Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
