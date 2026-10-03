"use client";

import { useEffect, useState } from "react";
import { EQUIPMENT, evaluateTemp } from "@/lib/schema";
import { api, fmtDateTime, ui } from "@/lib/ui";

const EMPTY = { equipment: EQUIPMENT[0], temperature: "", correctiveAction: "", notes: "" };

export default function TempLogsClient() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/temp-logs")
      .then((d) => setLogs(d.logs))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const temp = form.temperature === "" ? NaN : Number(form.temperature);
  const verdict = evaluateTemp(form.equipment, temp); // true | false | null
  const needsAction = verdict === false;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { log } = await api("/api/temp-logs", { method: "POST", body: JSON.stringify(form) });
      setLogs((prev) => [log, ...prev]);
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <main style={ui.page}>
      <a href="/dashboard" style={ui.back}>← Dashboard</a>
      <h1 style={ui.h1}>Temperature Logs</h1>

      <form onSubmit={submit} style={{ ...ui.card, marginBottom: 24 }}>
        <div style={ui.row}>
          <label style={{ ...ui.label, flex: 2, minWidth: 200 }}>
            Equipment
            <select value={form.equipment} onChange={set("equipment")} style={ui.input}>
              {EQUIPMENT.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label style={{ ...ui.label, flex: 1, minWidth: 120 }}>
            Temperature (°F)
            <input type="number" step="0.1" inputMode="decimal" required value={form.temperature} onChange={set("temperature")} style={ui.input} />
          </label>
        </div>

        {verdict !== null && !Number.isNaN(temp) && (
          <p style={{ margin: "0 0 12px", fontWeight: 600, color: verdict ? "green" : "crimson" }}>
            {verdict ? "✅ Within safe zone" : "❌ Outside safe zone — corrective action required"}
          </p>
        )}

        {needsAction && (
          <label style={ui.label}>
            Corrective action taken (required)
            <textarea required rows={2} value={form.correctiveAction} onChange={set("correctiveAction")} style={ui.input} />
          </label>
        )}

        <label style={ui.label}>
          Notes (optional)
          <textarea rows={2} value={form.notes} onChange={set("notes")} style={ui.input} />
        </label>

        {error && <p style={ui.error}>{error}</p>}
        <button type="submit" disabled={saving} style={ui.button}>{saving ? "Saving..." : "Log temperature"}</button>
      </form>

      {loading ? <p>Loading...</p> : logs.length === 0 ? <p style={ui.muted}>No readings logged yet.</p> : (
        <div style={ui.stack}>
          {logs.map((l) => (
            <div key={l.id} style={ui.card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{l.equipment}</strong>
                <span>{l.temperature}°F {l.safeZone}</span>
              </div>
              <div style={ui.muted}>{l.loggedBy} · {fmtDateTime(l.dateTime)}</div>
              {l.correctiveAction && <div style={{ fontSize: 14, marginTop: 6 }}><b>Corrective action:</b> {l.correctiveAction}</div>}
              {l.notes && <div style={{ fontSize: 14, marginTop: 4, color: "#444" }}>{l.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
