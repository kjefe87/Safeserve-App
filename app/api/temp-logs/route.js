import { NextResponse } from "next/server";
import { createTempLog, getTempLogs } from "@/lib/airtable";
import { requireSession } from "@/lib/guard";
import { EQUIPMENT, evaluateTemp, resolveOption } from "@/lib/schema";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  try {
    return NextResponse.json({ logs: await getTempLogs(session.restaurantName) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load temperature logs." }, { status: 500 });
  }
}

export async function POST(request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const equipment = resolveOption(EQUIPMENT, body.equipment);
  const temperature = Number(body.temperature);
  const correctiveAction = String(body.correctiveAction || "").trim();
  const notes = String(body.notes || "").trim();

  if (!equipment) return NextResponse.json({ error: "Pick a valid equipment type." }, { status: 400 });
  if (body.temperature === "" || body.temperature == null || !Number.isFinite(temperature) || temperature < -60 || temperature > 500) {
    return NextResponse.json({ error: "Enter a valid temperature in °F." }, { status: 400 });
  }
  if (evaluateTemp(equipment, temperature) === false && !correctiveAction) {
    return NextResponse.json(
      { error: "This reading is outside the safe zone. Describe the corrective action taken." },
      { status: 400 }
    );
  }

  try {
    const log = await createTempLog({
      equipment,
      temperature,
      correctiveAction,
      notes,
      userId: session.userId,
      userName: session.name,
      restaurantName: session.restaurantName,
    });
    return NextResponse.json({ log });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save temperature log." }, { status: 500 });
  }
}
