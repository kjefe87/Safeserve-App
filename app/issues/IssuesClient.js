"use client";

import { useEffect, useState } from "react";
import { AREAS, ISSUE_STATUS_LIST, ISSUE_TYPES, SEVERITIES } from "@/lib/schema";
import { SEVERITY_COLORS, api, fmtDate, fmtDateTime, ui } from "@/lib/ui";

const EMPTY = { issueType: ISSUE_TYPES[0], area: AREAS[0], severity: "Medium", description: "" };
const STATUS_OPTIONS = ISSUE_STATUS_LIST.map((s) => s.trim());
const FILTERS = ["Active", "Resolved", "All"];

export default function IssuesClient({ canManage }) {
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Active");

  function load() {
    return api("/api/issues")
      .then((d) => { setIssues(d.issues); setUsers(d.users); })
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
      const { issue } = await api("/api/issues", { method: "POST", body: JSON.stringify(form) });
      setIssues((prev) => [issue, ...prev]);
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const shown = issues.filter((i) =>
    filter === "All" ? true : filter === "Resolved" ? i.status === "Resolved" : i.status !== "Resolved"
  );

  return (
    <main style={ui.page}>
      <a href="/dashboard" style={ui.back}>← Dashboard</a>
      <h1 style={ui.h1}>Issues Log</h1>

      <form onSubmit={submit} style={{ ...ui.card, marginBottom: 24 }}>
        <strong>Report an issue</strong>
        <div style={{ ...ui.row, marginTop: 12 }}>
          <label style={{ ...ui.label, flex: 2, minWidth: 200 }}>
            Issue type
            <select value={form.issueType} onChange={set("issueType")} style={ui.input}>
              {ISSUE_TYPES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label style={{ ...ui.label, flex: 1, minWidth: 160 }}>
            Area
            <select value={form.area} onChange={set("area")} style={ui.input}>
              {AREAS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label style={{ ...ui.label, flex: 1, minWidth: 110 }}>
            Severity
            <select value={form.severity} onChange={set("severity")} style={ui.input}>
              {SEVERITIES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <label style={ui.label}>
          What's wrong?
          <textarea required rows={3} value={form.description} onChange={set("description")} style={ui.input} />
        </label>
        {error && <p style={ui.error}>{error}</p>}
        <button type="submit" disabled={saving} style={ui.button}>{saving ? "Submitting..." : "Report issue"}</button>
      </form>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...ui.button, fontWeight: filter === f ? 700 : 400 }}>{f}</button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : shown.length === 0 ? <p style={ui.muted}>Nothing here.</p> : (
        <div style={ui.stack}>
          {shown.map((i) => (
            <IssueCard key={i.id} issue={i} users={users} canManage={canManage} onSaved={load} />
          ))}
        </div>
      )}
    </main>
  );
}

function IssueCard({ issue, users, canManage, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(issue.status);
  const [assignedToId, setAssignedToId] = useState(issue.assignedToId);
  const [dueDate, setDueDate] = useState(issue.dueDate);
  const [resolutionNotes, setResolutionNotes] = useState(issue.resolutionNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    setSaving(true);
    try {
      await api(`/api/issues/${issue.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, assignedToId, dueDate, resolutionNotes }),
      });
      setEditing(false);
      await onSaved();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <div style={ui.card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <strong>#{issue.issueId} · {issue.issueType}</strong>
        <span style={ui.badge(SEVERITY_COLORS[issue.severity] || "#666")}>{issue.severity}</span>
      </div>
      <div style={{ fontSize: 14, margin: "6px 0" }}>{issue.description}</div>
      <div style={ui.muted}>
        {issue.area} · {issue.status} · reported by {issue.reportedBy || "—"} {fmtDateTime(issue.dateReported)}
      </div>
      {(issue.assignedTo || issue.dueDate) && (
        <div style={ui.muted}>
          {issue.assignedTo && <>Assigned to {issue.assignedTo}</>}
          {issue.assignedTo && issue.dueDate && " · "}
          {issue.dueDate && <>Due {fmtDate(issue.dueDate)}</>}
        </div>
      )}
      {issue.status === "Resolved" && (
        <div style={{ fontSize: 14, marginTop: 6 }}>
          <b>Resolved {fmtDate(issue.dateResolved)}:</b> {issue.resolutionNotes}
        </div>
      )}

      {canManage && !editing && (
        <button onClick={() => setEditing(true)} style={{ ...ui.button, marginTop: 10 }}>Update</button>
      )}

      {canManage && editing && (
        <div style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 12 }}>
          <div style={ui.row}>
            <label style={{ ...ui.label, flex: 1, minWidth: 140 }}>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={ui.input}>
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label style={{ ...ui.label, flex: 1, minWidth: 140 }}>
              Assigned to
              <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} style={ui.input}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
            <label style={{ ...ui.label, flex: 1, minWidth: 140 }}>
              Due date
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={ui.input} />
            </label>
          </div>
          <label style={ui.label}>
            Resolution notes {status === "Resolved" && "(required)"}
            <textarea rows={2} value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} style={ui.input} />
          </label>
          {error && <p style={ui.error}>{error}</p>}
          <button onClick={save} disabled={saving} style={ui.button}>{saving ? "Saving..." : "Save"}</button>{" "}
          <button onClick={() => setEditing(false)} style={ui.button}>Cancel</button>
        </div>
      )}
    </div>
  );
}
