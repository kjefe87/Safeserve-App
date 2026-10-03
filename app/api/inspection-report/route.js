import { NextResponse } from "next/server";
import { createInspectionReport, getInspectionReports, getInspectionSnapshot } from "@/lib/airtable";
import { MANAGER_ROLES, requireSession } from "@/lib/guard";
import { INSPECTION_TYPES, resolveOption } from "@/lib/schema";

export async function GET() {
  const { session, error } = await requireSession({ roles: MANAGER_ROLES });
  if (error) return error;
  try {
    const [reports, snapshot] = await Promise.all([
      getInspectionReports(session.restaurantName),
      getInspectionSnapshot(session.restaurantName),
    ]);
    return NextResponse.json({ reports, snapshot });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load inspection reports." }, { status: 500 });
  }
}

// Generates a report from live data (score, open/critical issue counts, status are computed server-side).
export async function POST(request) {
  const { session, error } = await requireSession({ roles: MANAGER_ROLES });
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const inspectionType = resolveOption(INSPECTION_TYPES, body.inspectionType);
  if (!inspectionType) return NextResponse.json({ error: "Pick an inspection type." }, { status: 400 });

  try {
    const report = await createInspectionReport({
      inspectionType,
      inspectorName: String(body.inspectorName || "").trim(),
      inspectorNotes: String(body.inspectorNotes || "").trim(),
      actionPlan: String(body.actionPlan || "").trim(),
      userId: session.userId,
      userName: session.name,
      restaurantName: session.restaurantName,
    });
    return NextResponse.json({ report });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate report." }, { status: 500 });
  }
}
