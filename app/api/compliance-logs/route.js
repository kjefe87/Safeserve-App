import { NextResponse } from "next/server";
import { getComplianceLogs } from "@/lib/airtable";
import { MANAGER_ROLES, requireSession } from "@/lib/guard";

export async function GET() {
  const { session, error } = await requireSession({ roles: MANAGER_ROLES });
  if (error) return error;
  try {
    return NextResponse.json({ logs: await getComplianceLogs(session.restaurantName) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load compliance logs." }, { status: 500 });
  }
}
