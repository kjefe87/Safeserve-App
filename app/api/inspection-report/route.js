import { NextResponse } from "next/server";
import { getInspectionReports } from "@/lib/airtable";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }
  if (session.role !== "Owner" && session.role !== "Manager") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  try {
    const records = await getInspectionReports(session.restaurantName);
    return NextResponse.json({ records });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load inspection reports." }, { status: 500 });
  }
}
