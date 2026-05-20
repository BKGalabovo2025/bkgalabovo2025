import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Member, Subscription } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  console.log("--- API /api/cron/check-statuses HIT! ---");

  // 1. Authorize (for production)
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("[cron/check-statuses] Unauthorized attempt blocked.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const sendEmailParam = searchParams.get("sendEmail");
    // Default to true if not explicitly set to "false"
    const shouldSendEmail = sendEmailParam !== "false";

    const adminDb = getAdminDb();

    // Step 1: Fetch active members
    console.log("Fetching active members...");
    const membersSnap = await adminDb
      .collection("members")
      .where("status", "==", "active")
      .get();

    const activeMembers = membersSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Member[];

    console.log(`Found ${activeMembers.length} active members.`);

    if (activeMembers.length === 0) {
      return NextResponse.json({
        message: "Няма активни членове за проверка.",
        processedCount: 0,
        deactivatedCount: 0,
      });
    }

    // Step 2: Fetch all subscriptions
    console.log("Fetching all member subscriptions...");
    const subsSnap = await adminDb.collection("memberSubscriptions").get();
    const allSubs = subsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Subscription[];

    console.log(`Retrieved ${allSubs.length} subscriptions.`);

    // Group subscriptions by memberId, excluding cancelled ones
    const subsByMemberId: Record<string, Subscription[]> = {};
    allSubs.forEach((sub) => {
      if (sub.status === "cancelled") return;
      if (!subsByMemberId[sub.memberId]) {
        subsByMemberId[sub.memberId] = [];
      }
      subsByMemberId[sub.memberId].push(sub);
    });

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    let deactivatedCount = 0;
    const deactivatedMembersInfo: Array<{
      id: string;
      name: string;
      email?: string;
    }> = [];

    // Step 3: Process each active member
    for (const member of activeMembers) {
      const memberName = `${member.firstName} ${member.lastName}`.trim();
      const memberSubs = subsByMemberId[member.id] || [];

      if (memberSubs.length === 0) {
        // Member is active but has no subscriptions at all.
        // We skip deactivating them automatically to avoid deactivating freshly registered members
        // who haven't selected an initial subscription yet.
        console.log(
          `Skipping member ${memberName} (${member.id}) - no subscriptions recorded.`
        );
        continue;
      }

      // Find the subscription with the latest endDate
      let latestSub: Subscription | null = null;
      for (const sub of memberSubs) {
        if (
          !latestSub ||
          new Date(sub.endDate).getTime() >
            new Date(latestSub.endDate).getTime()
        ) {
          latestSub = sub;
        }
      }

      if (!latestSub) continue;

      const latestEndDate = new Date(latestSub.endDate);

      // If the latest subscription has expired and its end date is more than 30 days ago:
      if (latestEndDate.getTime() < thirtyDaysAgo.getTime()) {
        console.log(
          `Deactivating member ${memberName} (${member.id}). Latest subscription ended on ${latestSub.endDate} (more than 30 days ago).`
        );

        // Update Member status to inactive
        await adminDb.collection("members").doc(member.id).update({
          status: "inactive",
          updatedAt: new Date().toISOString(),
        });

        // Also, update the expired subscription's status to "inactive" if it is still marked "active"
        if (latestSub.status === "active") {
          await adminDb
            .collection("memberSubscriptions")
            .doc(latestSub.id)
            .update({
              status: "inactive",
              updatedAt: new Date().toISOString(),
            });
        }

        deactivatedCount++;
        deactivatedMembersInfo.push({
          id: member.id,
          name: memberName,
          email: member.email || undefined,
        });

        // Step 4: Dispatch email notification if enabled and member has email
        if (shouldSendEmail && member.email) {
          try {
            const host = request.headers.get("host");
            const protocol = request.headers.get("x-forwarded-proto") || "http";
            const baseUrl = `${protocol}://${host}`;

            console.log(
              `Sending deactivation email to ${member.email} for member ${memberName}...`
            );

            const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.CRON_SECRET}`,
              },
              body: JSON.stringify({
                to: member.email,
                subject: "Промяна на статус на членство - БК Гълъбово",
                template: "deactivated",
                data: { memberName },
              }),
            });

            if (emailResponse.ok) {
              console.log(`Email successfully sent to ${member.email}`);
            } else {
              console.error(
                `Failed to send email to ${member.email}, status: ${emailResponse.status}`
              );
            }
          } catch (emailErr) {
            console.error(
              `Error sending deactivation email for ${memberName}:`,
              emailErr
            );
          }
        }
      }
    }

    console.log(`Cron job completed. Deactivated ${deactivatedCount} members.`);

    return NextResponse.json({
      message: "Автоматичната проверка завърши успешно.",
      processedCount: activeMembers.length,
      deactivatedCount: deactivatedCount,
      deactivatedMembers: deactivatedMembersInfo,
    });
  } catch (error) {
    console.error("CRITICAL FAILURE in /api/cron/check-statuses:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
