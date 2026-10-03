import { NextResponse } from "next/server";
import { markTaskComplete } from "@/lib/airtable";
import { requireSession } from "@/lib/guard";

export async function POST(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { taskId } = await request.json().catch(() => ({}));
  if (!taskId || typeof taskId !== "string") {
    return NextResponse.json({ error: "taskId is required." }, { status: 400 });
  }

  try {
    const result = await markTaskComplete({
      taskId,
      completedByRecordId: session.userId,
      restaurantName: session.restaurantName,
    });
    if (result.notFound) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ success: true, alreadyDone: !!result.alreadyDone });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to mark task complete." }, { status: 500 });
  }
}
