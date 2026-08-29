import { NextResponse } from "next/server";
import { markTaskComplete } from "@/lib/airtable";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const { taskId, taskName } = await request.json();
  if (!taskId || !taskName) {
    return NextResponse.json({ error: "taskId and taskName are required." }, { status: 400 });
  }

  try {
    await markTaskComplete({
      taskId,
      taskName,
      completedByName: session.name,
      restaurantName: session.restaurantName,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to mark task complete." }, { status: 500 });
  }
}
