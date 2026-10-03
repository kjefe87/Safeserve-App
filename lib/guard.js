import { NextResponse } from "next/server";
import { getUserById } from "@/lib/airtable";
import { getSession } from "@/lib/session";

// Re-checks the user against Airtable (cached 60s per server instance), so a
// deactivated user or a changed role takes effect within about a minute instead
// of when the session cookie expires.
const CACHE_MS = 60 * 1000;
const cache = new Map();

async function freshUser(id) {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.user;
  const user = await getUserById(id);
  cache.set(id, { user, at: Date.now() });
  return user;
}

// Use at the top of every API route.
//   const { session, error } = await requireSession({ roles: ["Owner", "Manager"] });
//   if (error) return error;
// `session` is built from the fresh Airtable user, not the cookie.
export async function requireSession({ roles } = {}) {
  const cookie = await getSession();
  if (!cookie.userId) {
    return { error: NextResponse.json({ error: "Not logged in." }, { status: 401 }) };
  }

  let user;
  try {
    user = await freshUser(cookie.userId);
  } catch (err) {
    console.error("Session re-check failed:", err);
    return { error: NextResponse.json({ error: "Service unavailable. Try again." }, { status: 503 }) };
  }

  if (!user || !user.active) {
    cookie.destroy();
    return { error: NextResponse.json({ error: "Not logged in." }, { status: 401 }) };
  }

  if (roles && !roles.includes(user.role)) {
    return { error: NextResponse.json({ error: "Not allowed." }, { status: 403 }) };
  }

  return {
    session: {
      userId: user.id,
      name: user.name,
      role: user.role,
      restaurantName: user.restaurantName,
    },
  };
}

export const MANAGER_ROLES = ["Owner", "Manager"];
