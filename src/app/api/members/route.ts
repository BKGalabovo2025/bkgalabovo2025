import { NextResponse } from "next/server";
import { createMemberWithSubscription } from "@/services/member-service";
import { getAllClubServices } from "@/services/subscription-service";
import { Member } from "@/types";
import { ensureAdmin } from "@/lib/auth-utils";

// Тип за данните, необходими за създаване на нов член
type NewMemberData = Pick<
  Member,
  "firstName" | "lastName" | "email" | "status" | "siteId"
>;

// POST /api/members - Create a new member and a default subscription
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
      // log unauthorized attempt and return
      const msg = authError instanceof Error ? authError.message : "Invalid authorization";
      // lightweight logging to assist audits
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const logger = require("@/lib/logger").default;
      logger.warn("Unauthorized access attempt to POST /api/members:", msg);
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", details: msg }),
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

    // 2. Find a default subscription service
    const allServices = await getAllClubServices();
    const defaultSubscriptionService = allServices.find(
      (s) => s.type === "Абонамент"
    );

    if (!defaultSubscriptionService) {
      console.error(
        "CRITICAL: No default subscription service of type 'Абонамент' found."
      );
      return new NextResponse(
        JSON.stringify({ error: "No default subscription service found" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Create the new member + default subscription in a single transaction
    const memberData: NewMemberData = {
      siteId,
      firstName,
      lastName,
      email,
      status: "active",
    };

    const result = await createMemberWithSubscription(
      memberData,
      {
        id: defaultSubscriptionService.id,
        name: defaultSubscriptionService.name,
        price: defaultSubscriptionService.price,
        currency: defaultSubscriptionService.currency,
      },
      { uid: "system", email: "system" }
    );

    const newMemberId = result.memberId;

    // 5. Construct and return the final response object
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
