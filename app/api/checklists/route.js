import { NextResponse } from "next/server";
import { getChecklists } from "@/lib/airtable";
import { requireSession } from "@/lib/guard";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const checklists = await getChecklists(session.restaurantName);
    return NextResponse.json({ checklists });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load checklists." }, { status: 500 });
  }
}
