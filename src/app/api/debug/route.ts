import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("reservations").get();
    const res = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
        (r: any) =>
          r.clientName &&
          (r.clientName.includes("31 май") || r.clientName.includes("Симеон"))
      )
      .map((r: any) => ({
        id: r.id,
        client: r.clientName,
        client2: r.client2Name,
        status: r.status,
        date: r.startTime.toDate().toISOString(),
        package: r.packageGroupId,
      }));
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
