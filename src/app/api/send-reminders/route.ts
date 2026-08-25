export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { getOverdueMembers } from "@/services/reminder-service.server";

// No longer need React, render, or the email component here.

async function authorizeRequest(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  ) {
    return true;
  }
  try {
    const token = authHeader?.split("Bearer ")[1];
    if (!token) return false;
    const { ensureAdmin } = await import("@/lib/auth-utils");
    await ensureAdmin(token);
    return true;
  } catch {
    return false;
  }
}

async function dispatchMemberEmail(
  member: {
    id: string;
    email?: string | null;
    firstName?: string;
    lastName?: string;
  },
  baseUrl: string
): Promise<boolean> {
  const memberName = `${member.firstName} ${member.lastName}`.trim();
  if (!member.email) {
    console.log(
      `SKIPPING: Member ${memberName} (ID: ${member.id}) has no email address.`
    );
    return false;
  }

  try {
    const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({
        to: member.email,
        subject: "Напомняне за просрочено плащане",
        template: "reminder",
        data: { memberName },
      }),
    });

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.json().catch(() => ({
        error: "Could not parse error response from /api/send-email",
      }));
      throw new Error(
        errorBody.error ||
          `Internal API /api/send-email failed with status ${emailResponse.status}`
      );
    }
    return true;
  } catch (emailError) {
    console.error(
      "FAILURE: Failed to dispatch email for %s. Reason:",
      memberName,
      emailError instanceof Error ? emailError.message : emailError
    );
    return false;
  }
}

export async function POST(request: Request) {
  console.log("--- API /api/send-reminders HIT! ---");

  const isAuthorized = await authorizeRequest(request);
  if (!isAuthorized) {
    console.warn("[send-reminders] Unauthorized attempt blocked.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sites = ["bkgalabovo", "recoveryzone"];
    let totalSentCount = 0;
    let totalFailedCount = 0;

    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    for (const siteId of sites) {
      console.log(`Processing reminders for site: ${siteId}`);
      const overdueMembers = await getOverdueMembers(siteId);

      for (const member of overdueMembers) {
        const success = await dispatchMemberEmail(member, baseUrl);
        if (success) {
          totalSentCount++;
        } else if (member.email) {
          totalFailedCount++;
        }
      }
    }

    console.log("--- API /api/send-reminders FINISHED. ---");
    console.log(
      `Total: ${totalSentCount} email requests accepted, ${totalFailedCount} failed.`
    );

    if (totalFailedCount > 0) {
      return NextResponse.json(
        {
          message: `Процесът завърши. Успешни заявки: ${totalSentCount}, Неуспешни: ${totalFailedCount}. Проверете логовете на сървъра за повече детайли.`,
          sentCount: totalSentCount,
          failedCount: totalFailedCount,
        },
        { status: 207 }
      ); // 207 Multi-Status
    } else {
      return NextResponse.json(
        {
          message: `Заявките за напомнящи имейли бяха изпратени успешно за ${totalSentCount} членове.`,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("CRITICAL FAILURE in /api/send-reminders:", error);
    let errorMessage =
      "Възникна критична грешка при изпращането на напомняния.";
    if (error instanceof Error) {
      errorMessage = `Възникна критична грешка: ${error.message}`;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
