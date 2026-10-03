import { NextResponse } from "next/server";
import { createStaffCertification, getRestaurantUsers, getStaffCertifications } from "@/lib/airtable";
import { MANAGER_ROLES, requireSession } from "@/lib/guard";
import { CERT_TYPES, resolveOption } from "@/lib/schema";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const { session, error } = await requireSession({ roles: MANAGER_ROLES });
  if (error) return error;
  try {
    const [certs, users] = await Promise.all([
      getStaffCertifications(session.restaurantName),
      getRestaurantUsers(session.restaurantName),
    ]);
    return NextResponse.json({
      certs,
      staffNames: users.filter((u) => u.active).map((u) => u.name),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load certifications." }, { status: 500 });
  }
}

export async function POST(request) {
  const { session, error } = await requireSession({ roles: MANAGER_ROLES });
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const staffMemberName = String(body.staffMemberName || "").trim();
  const certificationType = resolveOption(CERT_TYPES, body.certificationType);
  const certificateNumber = String(body.certificateNumber || "").trim();
  const issueDate = body.issueDate || "";
  const expiryDate = body.expiryDate || "";

  if (!staffMemberName || !certificationType) {
    return NextResponse.json({ error: "Staff member and certification type are required." }, { status: 400 });
  }
  if (!DATE_RE.test(expiryDate) || (issueDate && !DATE_RE.test(issueDate))) {
    return NextResponse.json({ error: "Enter valid dates." }, { status: 400 });
  }
  if (issueDate && expiryDate < issueDate) {
    return NextResponse.json({ error: "Expiry date can't be before the issue date." }, { status: 400 });
  }

  try {
    const cert = await createStaffCertification({
      staffMemberName,
      certificationType,
      certificateNumber,
      issueDate,
      expiryDate,
      restaurantName: session.restaurantName,
    });
    return NextResponse.json({ cert });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save certification." }, { status: 500 });
  }
}
