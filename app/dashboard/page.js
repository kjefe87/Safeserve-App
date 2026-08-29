import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// Pages every role can see vs. Owner/Manager-only pages —
// mirrors the visibility table in the SafeServe handoff note section 2.3.
const STAFF_LINKS = [
  { href: "/checklists", label: "Checklists" },
  { href: "/issues", label: "Issues Log" },
  { href: "/temp-logs", label: "Temperature Logs" },
];

const OWNER_MANAGER_LINKS = [
  { href: "/inspection-report", label: "Inspection Report" },
  { href: "/staff-certs", label: "Staff Certifications" },
  { href: "/compliance-logs", label: "Compliance Logs" },
];

export default async function DashboardPage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/login");
  }

  const isOwnerOrManager = session.role === "Owner" || session.role === "Manager";
  const links = isOwnerOrManager ? [...STAFF_LINKS, ...OWNER_MANAGER_LINKS] : STAFF_LINKS;

  return (
    <main style={{ maxWidth: 480, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22 }}>Welcome, {session.name}</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        {session.role} · {session.restaurantName}
      </p>

      <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              display: "block",
              padding: "12px 16px",
              border: "1px solid #ddd",
              borderRadius: 8,
              textDecoration: "none",
              color: "#111",
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <form action="/api/auth/logout" method="post" style={{ marginTop: 32 }}>
        <button type="submit" style={{ padding: "8px 12px", cursor: "pointer" }}>
          Log out
        </button>
      </form>
    </main>
  );
}
