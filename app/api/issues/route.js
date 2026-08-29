import { NextResponse } from "next/server";
import { getIssuesLog } from "@/lib/airtable";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  try {
    const records = await getIssuesLog(session.restaurantName);
    return NextResponse.json({ records });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load issues log." }, { status: 500 });
  }
}
