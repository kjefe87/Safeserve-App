import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/airtable";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const { email, pin } = await request.json();

  if (!email || !pin) {
    return NextResponse.json({ error: "Email and PIN are required." }, { status: 400 });
  }

  let user;
  try {
    user = await findUserByEmail(email.trim().toLowerCase());
  } catch (err) {
    console.error("Airtable lookup failed:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }

  // Same "Invalid email or PIN" message whether the email doesn't exist or the PIN
  // is wrong — don't reveal which one failed, that tells an attacker which emails are real.
  if (!user || !user.pinHash) {
    return NextResponse.json({ error: "Invalid email or PIN." }, { status: 401 });
  }

  const pinMatches = await bcrypt.compare(pin.trim(), user.pinHash);
  if (!pinMatches) {
    return NextResponse.json({ error: "Invalid email or PIN." }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.name = user.name;
  session.email = user.email;
  session.role = user.role;
  session.restaurantName = user.restaurantName;
  await session.save();

  return NextResponse.json({ success: true, role: user.role });
}
