import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

interface DebugReservation {
  id: string;
  clientName?: string;
  client2Name?: string;
  status?: string;
  startTime?: { toDate: () => Date };
  packageGroupId?: string;
}

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("reservations").get();
    const res = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
        (r: DebugReservation) =>
          r.clientName &&
          (r.clientName.includes("31 май") || r.clientName.includes("Симеон"))
      )
      .map((r: DebugReservation) => ({
        id: r.id,
        client: r.clientName,
        client2: r.client2Name,
        status: r.status,
        date: r.startTime?.toDate().toISOString(),
        package: r.packageGroupId,
      }));
    return NextResponse.json(res);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
