import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

// Session data shape stored in the encrypted cookie.
// { userId, name, email, role, restaurantName }

export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "safeserve_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

// Use inside Server Components / Route Handlers.
export async function getSession() {
  return getIronSession(await cookies(), sessionOptions);
}
