import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/airtable";
import { clearFailures, clientIp, isLockedOut, recordFailure } from "@/lib/ratelimit";
import { getSession } from "@/lib/session";

// Used to burn the same bcrypt time when the email doesn't exist, so response
// timing doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-pin", 10);

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const pin = String(body.pin || "").trim();

  if (!email || !pin) {
    return NextResponse.json({ error: "Email and PIN are required." }, { status: 400 });
  }

  const limitKey = `${clientIp(request)}|${email}`;
  if (isLockedOut(limitKey)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  let user;
  try {
    user = await findUserByEmail(email);
  } catch (err) {
    console.error("Airtable lookup failed:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }

  // Same error whether the email doesn't exist or the PIN is wrong.
  const pinMatches = await bcrypt.compare(pin, user?.pinHash || DUMMY_HASH);
  if (!user || !user.pinHash || !pinMatches) {
    recordFailure(limitKey);
    return NextResponse.json({ error: "Invalid email or PIN." }, { status: 401 });
  }

  clearFailures(limitKey);
  const session = await getSession();
  session.userId = user.id;
  session.name = user.name;
  session.email = user.email;
  session.role = user.role;
  session.restaurantName = user.restaurantName;
  await session.save();

  return NextResponse.json({ success: true, role: user.role });
}
