import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
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
  } catch (error: any) {
    return new NextResponse("Error: " + error.message, { status: 500 });
  }
}
