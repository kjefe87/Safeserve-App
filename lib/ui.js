// Shared inline styles + tiny client helpers (kept inline to match the existing app).
import { TIMEZONE } from "@/lib/schema";

export const ui = {
  page: { maxWidth: 760, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" },
  back: { fontSize: 14, color: "#555" },
  h1: { fontSize: 22, marginTop: 8, marginBottom: 20 },
  h2: { fontSize: 17, margin: "28px 0 12px" },
  card: { border: "1px solid #ddd", borderRadius: 8, padding: "12px 16px", background: "#fff" },
  stack: { display: "flex", flexDirection: "column", gap: 10 },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  label: { display: "block", marginBottom: 12, fontSize: 14 },
  input: { display: "block", width: "100%", padding: 8, marginTop: 4, boxSizing: "border-box", font: "inherit" },
  button: { padding: "8px 14px", cursor: "pointer" },
  error: { color: "crimson", margin: "8px 0" },
  muted: { fontSize: 13, color: "#666" },
  badge: (bg, fg = "#fff") => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 12,
    background: bg,
    color: fg,
    fontWeight: 600,
  }),
};

export const SEVERITY_COLORS = {
  Critical: "#b91c1c",
  High: "#ea580c",
  Medium: "#ca8a04",
  Low: "#2563eb",
};

export async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Not logged in.");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export function fmtDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    timeZone: TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDate(iso) {
  if (!iso) return "";
  // Plain YYYY-MM-DD dates: avoid timezone shifting by parsing manually.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
