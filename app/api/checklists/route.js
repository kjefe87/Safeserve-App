import { NextResponse } from "next/server";
import { getChecklists } from "@/lib/airtable";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  try {
    const checklists = await getChecklists();
    return NextResponse.json({ checklists });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load checklists." }, { status: 500 });
  }
}
