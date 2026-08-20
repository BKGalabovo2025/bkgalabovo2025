import { NextResponse } from "next/server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    // Basic auth check: we expect a Bearer token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const adminAuth = getAdminAuth();
    const user = await adminAuth.verifyIdToken(token);

    if (!user.admin && user.email !== "bkgalabovo2014@gmail.com") {
      return NextResponse.json(
        { error: "Forbidden: Admin only" },
        { status: 403 }
      );
    }

    const db = getAdminDb();
    const membersSnap = await db.collection("members").get();

    const batch = db.batch();
    let updatedCount = 0;

    membersSnap.forEach((doc) => {
      const data = doc.data();
      let needsUpdate = false;
      const updateData: Record<string, string> = {};

      if (!data.siteId) {
        updateData.siteId = "bkgalabovo";
        needsUpdate = true;
      }

      if (!data.firstName || !data.lastName) {
        if (data.name && typeof data.name === "string") {
          const parts = data.name.trim().split(" ");
          updateData.firstName = parts[0] || "Неизвестно";
          updateData.lastName = parts.slice(1).join(" ") || "Неизвестно";
        } else {
          updateData.firstName = "Неизвестно";
          updateData.lastName = "Неизвестно";
        }
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(doc.ref, updateData);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed. Updated ${updatedCount} members.`,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
