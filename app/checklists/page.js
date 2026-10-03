"use client";

import { useEffect, useState } from "react";

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/checklists")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error(data.error || "Failed to load checklists.");
        setChecklists(data.checklists || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleComplete(task) {
    setCompletingId(task.id);
    setError("");
    const res = await fetch("/api/checklists/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, taskName: task.taskName }),
    });

    if (res.ok) {
      setChecklists((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "Completed" } : t))
      );
    } else {
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) window.location.href = "/login";
      setError(data.error || "Couldn't save that. Try again.");
    }
    setCompletingId(null);
  }

  if (loading) return <main style={{ padding: 24, fontFamily: "sans-serif" }}>Loading...</main>;

  return (
    <main style={{ maxWidth: 560, margin: "40px auto", fontFamily: "sans-serif" }}>
      <a href="/dashboard" style={{ fontSize: 14, color: "#555" }}>
        ← Dashboard
      </a>
      <h1 style={{ fontSize: 22, marginTop: 8, marginBottom: 20 }}>Checklists</h1>
      {error && <p style={{ color: "crimson", marginBottom: 12 }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {checklists.map((task) => (
          <div
            key={task.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                {task.taskName} {task.critical ? "⚠️" : ""}
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>
                {task.section} · {task.frequency} · {task.area}
              </div>
            </div>

            {task.status === "Completed" ? (
              <span style={{ color: "green", fontSize: 14 }}>✅ Done</span>
            ) : (
              <button
                onClick={() => handleComplete(task)}
                disabled={completingId === task.id}
                style={{ padding: "6px 12px", cursor: "pointer" }}
              >
                {completingId === task.id ? "..." : "Mark Complete"}
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
