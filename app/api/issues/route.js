import { NextResponse } from "next/server";
import { createIssue, getIssuesLog } from "@/lib/airtable";
import { requireSession } from "@/lib/guard";
import { AREAS, ISSUE_TYPES, SEVERITIES, resolveOption } from "@/lib/schema";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  try {
    return NextResponse.json(await getIssuesLog(session.restaurantName));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load issues." }, { status: 500 });
  }
}

export async function POST(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const issueType = resolveOption(ISSUE_TYPES, body.issueType);
  const area = resolveOption(AREAS, body.area);
  const severity = resolveOption(SEVERITIES, body.severity);
  const description = String(body.description || "").trim();

  if (!issueType || !area || !severity) {
    return NextResponse.json({ error: "Issue type, area and severity are required." }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "Describe the problem." }, { status: 400 });
  }

  try {
    const issue = await createIssue({
      issueType,
      description,
      area,
      severity,
      userId: session.userId,
      userName: session.name,
      restaurantName: session.restaurantName,
    });
    return NextResponse.json({ issue });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to report issue." }, { status: 500 });
  }
}
