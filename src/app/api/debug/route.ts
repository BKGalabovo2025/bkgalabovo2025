import { NextResponse } from "next/server";

import { ensureAdmin } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";

interface DebugReservation {
  id: string;
  clientName?: string;
  client2Name?: string;
  status?: string;
  startTime?: { toDate: () => Date };
  packageGroupId?: string;
}

export async function GET(request: Request) {
  try {
    // Require admin authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    try {
      await ensureAdmin(token);
    } catch {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
