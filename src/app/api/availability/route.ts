import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { getResourceTakenIntervals } from "@/lib/queries";
import { generateSlots } from "@/lib/core/availability";

export async function GET(req: NextRequest) {
  const rid = req.nextUrl.searchParams.get("resourceId");
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD
  const duration = Number(req.nextUrl.searchParams.get("duration") || 60);
  if (!rid || !date) return NextResponse.json({ error: "missing params" }, { status: 400 });

  const res = (await getDb().select().from(resources).where(eq(resources.id, rid)).limit(1))[0];
  if (!res) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d, 0, 0, 0, 0);
  const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const dayEnd = dayStart + 86400000;
  const taken = await getResourceTakenIntervals(rid, dayStart, dayEnd);

  const slots = generateSlots({
    date: day, openHour: res.openHour, closeHour: res.closeHour, durationMins: duration, stepMins: 30,
    booked: taken.booked, reserved: taken.reserved, blocked: taken.blocked,
  });
  return NextResponse.json({ slots });
}
