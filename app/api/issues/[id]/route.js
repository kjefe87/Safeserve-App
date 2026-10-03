import { NextResponse } from "next/server";
import { getIssueForRestaurant, getRestaurantUsers, updateIssue } from "@/lib/airtable";
import { MANAGER_ROLES, requireSession } from "@/lib/guard";
import { ISSUE_STATUS, ISSUE_STATUS_LIST, resolveOption } from "@/lib/schema";

// Owner/Manager only: change status, assign, set due date, record resolution.
export async function PATCH(request, { params }) {
  const { session, error } = await requireSession({ roles: MANAGER_ROLES });
  if (error) return error;

  const { id } = await params;
  const existing = await getIssueForRestaurant(id, session.restaurantName);
  if (!existing) return NextResponse.json({ error: "Issue not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const changes = {};

  if (body.status !== undefined) {
    const status = resolveOption(ISSUE_STATUS_LIST, body.status);
    if (!status) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    changes.status = status;
  }

  if (body.resolutionNotes !== undefined) {
    changes.resolutionNotes = String(body.resolutionNotes).trim();
  }

  if (changes.status === ISSUE_STATUS.RESOLVED) {
    const notes = changes.resolutionNotes ?? existing.fields["Resolution Notes"] ?? "";
    if (!String(notes).trim()) {
      return NextResponse.json({ error: "Add resolution notes before resolving an issue." }, { status: 400 });
    }
  }

  if (body.dueDate !== undefined) {
    if (body.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
      return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
    }
    changes.dueDate = body.dueDate || "";
  }

  if (body.assignedToId !== undefined) {
    if (body.assignedToId) {
      const users = await getRestaurantUsers(session.restaurantName);
      if (!users.some((u) => u.id === body.assignedToId)) {
        return NextResponse.json({ error: "Invalid assignee." }, { status: 400 });
      }
    }
    changes.assignedToId = body.assignedToId || "";
  }

  try {
    await updateIssue(id, changes);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update issue." }, { status: 500 });
  }
}
