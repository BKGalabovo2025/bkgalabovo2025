import { NextResponse } from "next/server";

import {
  notifyAdminParentSessionReport,
  ParentSessionReportData,
} from "@/lib/parent-email-templates";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body: ParentSessionReportData = await req.json();

    if (!body || !body.actions || body.actions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No actions to report",
      });
    }

    const sent = await notifyAdminParentSessionReport(body);
    return NextResponse.json({ success: sent });
  } catch (error) {
    console.error(
      "[api/parents/session-report] Error sending email report:",
      error
    );
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
