"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isLocalDev = process.env.NODE_ENV === "development";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Login failed.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>SafeServe</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 12 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          PIN
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        {error && <p style={{ color: "crimson", marginBottom: 12 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10, cursor: "pointer" }}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      {isLocalDev && (
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setError("");
            setLoading(true);
            const res = await fetch("/api/auth/dev-login", { method: "POST" });
            setLoading(false);
            if (!res.ok) {
              setError("Local preview login failed.");
              return;
            }
            router.push("/dashboard");
          }}
          style={{
            width: "100%",
            padding: 10,
            cursor: "pointer",
            marginTop: 12,
            background: "transparent",
          }}
        >
          Continue without Airtable (local only)
        </button>
      )}
    </main>
  );
}
