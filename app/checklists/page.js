"use client";

import { useEffect, useState } from "react";

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    fetch("/api/checklists")
      .then((res) => res.json())
      .then((data) => {
        setChecklists(data.checklists || []);
        setLoading(false);
      });
  }, []);

  async function handleComplete(task) {
    setCompletingId(task.id);
    const res = await fetch("/api/checklists/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, taskName: task.taskName }),
    });

    if (res.ok) {
      setChecklists((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "Completed" } : t))
      );
    }
    setCompletingId(null);
  }

  if (loading) return <main style={{ padding: 24, fontFamily: "sans-serif" }}>Loading...</main>;

  return (
    <main style={{ maxWidth: 560, margin: "40px auto", fontFamily: "sans-serif" }}>
      <a href="/dashboard" style={{ fontSize: 14, color: "#555" }}>
        ← Dashboard
      </a>
      <h1 style={{ fontSize: 22, marginTop: 8, marginBottom: 20 }}>Daily Checklists</h1>

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
