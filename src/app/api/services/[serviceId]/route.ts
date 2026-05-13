import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

async function getService(id: string) {
  if (!id) return null;

  const adminDb = getAdminDb();
  const serviceRef = adminDb.collection("clubServices").doc(id);
  const docSnap = await serviceRef.get();

  if (!docSnap.exists) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await context.params;
    const service = await getService(serviceId);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
