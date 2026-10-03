import { NextResponse } from "next/server";
import { getInspectionReportById } from "@/lib/airtable";
import { MANAGER_ROLES, requireSession } from "@/lib/guard";
import { buildInspectionPdf } from "@/lib/reportPdf";

export const runtime = "nodejs"; // pdf-lib needs the Node runtime, not Edge

// Owner/Manager only. The report must belong to the caller's restaurant.
export async function GET(_request, { params }) {
  const { session, error } = await requireSession({ roles: MANAGER_ROLES });
  if (error) return error;

  const { id } = await params;
  if (!/^rec[A-Za-z0-9]{14}$/.test(id)) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  try {
    const report = await getInspectionReportById(id, session.restaurantName);
    if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

    const bytes = await buildInspectionPdf(report);
    const name = `SafeServe-Inspection-Report-${report.reportId ?? "x"}-${report.reportDate || "undated"}.pdf`.replace(/[^A-Za-z0-9._-]/g, "_");
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to build the PDF." }, { status: 500 });
  }
}
