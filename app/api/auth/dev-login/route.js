import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// Local-only session so the UI can be built without Airtable.
// This route is disabled in production.
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const session = await getSession();
  session.userId = "local-dev";
  session.name = "Local preview";
  session.email = "local@dev";
  session.role = "Owner";
  session.restaurantName = "Local preview";
  await session.save();

  return NextResponse.json({ success: true });
}
