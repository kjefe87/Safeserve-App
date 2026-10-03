"use client";

import { useEffect, useState } from "react";
import { INSPECTION_TYPES } from "@/lib/schema";
import { api, fmtDate, ui } from "@/lib/ui";

const TYPES = INSPECTION_TYPES.map((t) => t.trim());
const EMPTY = { inspectionType: TYPES[2], inspectorName: "", inspectorNotes: "", actionPlan: "" };
const STATUS_COLORS = { Ready: "#15803d", "Needs Attention": "#ca8a04", "At Risk": "#b91c1c" };

export default function InspectionClient() {
  const [reports, setReports] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    return api("/api/inspection-report")
      .then((d) => { setReports(d.reports); setSnapshot(d.snapshot); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api("/api/inspection-report", { method: "POST", body: JSON.stringify(form) });
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const stat = { ...ui.card, flex: 1, minWidth: 130, textAlign: "center" };
  const big = { fontSize: 26, fontWeight: 700 };

  return (
    <main style={ui.page}>
      <a href="/dashboard" style={ui.back}>← Dashboard</a>
      <h1 style={ui.h1}>Inspection Report</h1>

      {loading ? <p>Loading...</p> : snapshot && (
        <>
          <h2 style={{ ...ui.h2, marginTop: 0 }}>Right now</h2>
          <div style={ui.row}>
            <div style={stat}><div style={big}>{snapshot.score}%</div><div style={ui.muted}>Checklist compliance ({snapshot.tasksDone}/{snapshot.tasksTotal})</div></div>
            <div style={stat}><div style={big}>{snapshot.openIssues}</div><div style={ui.muted}>Open issues</div></div>
            <div style={stat}><div style={{ ...big, color: snapshot.criticalIssues ? "#b91c1c" : "inherit" }}>{snapshot.criticalIssues}</div><div style={ui.muted}>Critical / High open</div></div>
            <div style={stat}>
              <span style={ui.badge(STATUS_COLORS[snapshot.overallStatus.trim()] || "#666")}>{snapshot.overallStatus.trim()}</span>
              <div style={ui.muted}>Overall</div>
            </div>
          </div>
        </>
      )}

      <h2 style={ui.h2}>Generate a report</h2>
      <form onSubmit={submit} style={ui.card}>
        <p style={{ ...ui.muted, marginTop: 0 }}>Saves a snapshot of the numbers above, as of now.</p>
        <div style={ui.row}>
          <label style={{ ...ui.label, flex: 1, minWidth: 200 }}>
            Inspection type
            <select value={form.inspectionType} onChange={set("inspectionType")} style={ui.input}>
              {TYPES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label style={{ ...ui.label, flex: 1, minWidth: 200 }}>
            Inspector name (official visits)
            <input value={form.inspectorName} onChange={set("inspectorName")} style={ui.input} />
          </label>
        </div>
        <label style={ui.label}>
          Inspector notes
          <textarea rows={2} value={form.inspectorNotes} onChange={set("inspectorNotes")} style={ui.input} />
        </label>
        <label style={ui.label}>
          Action plan
          <textarea rows={2} value={form.actionPlan} onChange={set("actionPlan")} style={ui.input} />
        </label>
        {error && <p style={ui.error}>{error}</p>}
        <button type="submit" disabled={saving} style={ui.button}>{saving ? "Generating..." : "Generate report"}</button>
      </form>

      <h2 style={ui.h2}>Past reports</h2>
      {reports.length === 0 ? <p style={ui.muted}>No reports yet.</p> : (
        <div style={ui.stack}>
          {reports.map((r) => (
            <div key={r.id} style={ui.card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>#{r.reportId} · {r.inspectionType} · {fmtDate(r.reportDate)}</strong>
                <span style={ui.badge(STATUS_COLORS[r.overallStatus] || "#666")}>{r.overallStatus}</span>
              </div>
              <div style={ui.muted}>
                Score {r.complianceScore}% · {r.openIssues} open issues · {r.criticalIssues} critical/high
                {r.generatedBy && ` · by ${r.generatedBy}`}
              </div>
              {r.inspectorName && <div style={{ fontSize: 14, marginTop: 6 }}><b>Inspector:</b> {r.inspectorName}</div>}
              {r.inspectorNotes && <div style={{ fontSize: 14 }}><b>Notes:</b> {r.inspectorNotes}</div>}
              {r.actionPlan && <div style={{ fontSize: 14 }}><b>Action plan:</b> {r.actionPlan}</div>}
              <div style={{ marginTop: 8, display: "flex", gap: 14, alignItems: "center" }}>
                <a href={`/api/inspection-report/${r.id}/pdf`} style={{ ...ui.button, textDecoration: "none", border: "1px solid #888", borderRadius: 4, color: "inherit" }}>
                  Download PDF
                </a>
                {!r.hasDetail && <span style={ui.muted}>Older report: counts only (no issue list saved)</span>}
                {r.pdfUrl && <a href={r.pdfUrl} style={{ fontSize: 14 }}>Attached PDF</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
