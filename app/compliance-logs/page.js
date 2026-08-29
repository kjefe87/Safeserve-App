"use client";

import { Fragment, useEffect, useState } from "react";
import { recordTitle } from "@/lib/format";

export default function ComplianceLogsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/compliance-logs")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setRecords(data.records || []);
        setLoading(false);
      });
  }, []);

  return (
    <main className="page-shell" style={{ "--page-accent": "#2B3A55" }}>
      <a href="/dashboard" className="back-link">
        ← Dashboard
      </a>
      <span className="eyebrow">Owner &amp; manager only</span>
      <h1 className="page-title">Compliance Logs</h1>

      {loading && <p className="state-message">Loading compliance logs…</p>}
      {error && <p className="state-message is-error">{error}</p>}
      {!loading && !error && records.length === 0 && (
        <div className="empty-state">
          No compliance logs recorded yet. Health-code and policy records will
          show up here as they're logged.
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
