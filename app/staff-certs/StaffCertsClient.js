"use client";

import { useEffect, useState } from "react";
import { CERT_TYPES } from "@/lib/schema";
import { api, fmtDate, ui } from "@/lib/ui";

const EMPTY = { staffMemberName: "", certificationType: CERT_TYPES[0], certificateNumber: "", issueDate: "", expiryDate: "" };

function statusColor(status) {
  if (status.includes("EXPIRED")) return "#b91c1c";
  if (status.includes("SOON")) return "#ca8a04";
  return "#15803d";
}

export default function StaffCertsClient() {
  const [certs, setCerts] = useState([]);
  const [staffNames, setStaffNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/staff-certs")
      .then((d) => { setCerts(d.certs); setStaffNames(d.staffNames); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api("/api/staff-certs", { method: "POST", body: JSON.stringify(form) });
      setForm(EMPTY);
      // Reload so the Airtable-calculated Status comes back with the new row, in expiry order.
      const d = await api("/api/staff-certs");
      setCerts(d.certs);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <main style={ui.page}>
      <a href="/dashboard" style={ui.back}>← Dashboard</a>
      <h1 style={ui.h1}>Staff Certifications</h1>

      <form onSubmit={submit} style={{ ...ui.card, marginBottom: 24 }}>
        <strong>Add certification</strong>
        <div style={{ ...ui.row, marginTop: 12 }}>
          <label style={{ ...ui.label, flex: 1, minWidth: 180 }}>
            Staff member
            <input list="staff-names" required value={form.staffMemberName} onChange={set("staffMemberName")} style={ui.input} />
            <datalist id="staff-names">{staffNames.map((n) => <option key={n} value={n} />)}</datalist>
          </label>
          <label style={{ ...ui.label, flex: 1, minWidth: 150 }}>
            Type
            <select value={form.certificationType} onChange={set("certificationType")} style={ui.input}>
              {CERT_TYPES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label style={{ ...ui.label, flex: 1, minWidth: 150 }}>
            Certificate number
            <input value={form.certificateNumber} onChange={set("certificateNumber")} style={ui.input} />
          </label>
        </div>
        <div style={ui.row}>
          <label style={{ ...ui.label, flex: 1, minWidth: 150 }}>
            Issue date
            <input type="date" value={form.issueDate} onChange={set("issueDate")} style={ui.input} />
          </label>
          <label style={{ ...ui.label, flex: 1, minWidth: 150 }}>
            Expiry date
            <input type="date" required value={form.expiryDate} onChange={set("expiryDate")} style={ui.input} />
          </label>
        </div>
        {error && <p style={ui.error}>{error}</p>}
        <button type="submit" disabled={saving} style={ui.button}>{saving ? "Saving..." : "Add certification"}</button>
      </form>

      {loading ? <p>Loading...</p> : certs.length === 0 ? <p style={ui.muted}>No certifications recorded yet.</p> : (
        <div style={ui.stack}>
          {certs.map((c) => (
            <div key={c.id} style={{ ...ui.card, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <strong>{c.staffMemberName}</strong>
                <div style={ui.muted}>
                  {c.certificationType}{c.certificateNumber && ` · #${c.certificateNumber}`}
                </div>
                <div style={ui.muted}>
                  {c.issueDate && <>Issued {fmtDate(c.issueDate)} · </>}Expires {fmtDate(c.expiryDate)}
                </div>
              </div>
              {c.status && <span style={ui.badge(statusColor(c.status))}>{c.status.replace(/^[^A-Z]+/, "")}</span>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
