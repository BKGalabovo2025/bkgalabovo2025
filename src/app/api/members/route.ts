import { NextResponse } from "next/server";

import { ensureAdmin } from "@/lib/auth-utils";
import { addMember } from "@/services/member-service";
import { Member } from "@/types";

// Тип за данните, необходими за създаване на нов член
type NewMemberData = Pick<
  Member,
  "firstName" | "lastName" | "email" | "status" | "siteId"
>;

// POST /api/members - Create a new member
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", details: "Missing token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const token = authHeader.substring(7);
    try {
      await ensureAdmin(token);
    } catch (authError) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
          details:
            authError instanceof Error
              ? authError.message
              : "Invalid authorization",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, siteId } = body;

    // 1. Basic validation
    if (!firstName || !lastName || !email || !siteId) {
      return new NextResponse(
        "First name, last name, email and siteId are required",
        {
          status: 400,
        }
      );
    }

    // 2. Create the new member
    const memberData: NewMemberData = {
      siteId,
      firstName,
      lastName,
      email,
      status: "active",
    };
    const newMemberId = await addMember(memberData);

    try {
      const { getAdminDb } = await import("@/lib/firebase-admin");
      const adminDb = getAdminDb();
      await adminDb.collection("audit_logs").add({
        userId: "admin",
        action: "CREATE",
        targetCollection: "members",
        targetId: newMemberId,
        details: { email, name: `${firstName} ${lastName}` },
        siteId,
        timestamp: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.error("Failed to write audit log in /api/members:", auditErr);
    }

    // 3. Construct and return the final response object
    const responsePayload = {
      id: newMemberId,
      ...memberData,
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/members:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { status: 500 }
    );
  }
}
