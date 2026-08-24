import { NextResponse } from "next/server";

import { ensureAdmin } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";

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

    const adminDb = getAdminDb();
    const snap = await adminDb.collection("reservations").limit(10).get();
    let result = "";
    snap.docs.forEach((doc) => {
      result += `${doc.id}: ${JSON.stringify(doc.data())}\n`;
    });
    return new NextResponse(result, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse("Error: " + message, { status: 500 });
  }
}
