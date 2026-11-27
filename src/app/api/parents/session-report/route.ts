import { NextResponse } from "next/server";
import { z } from "zod";

import { getParentSession } from "@/lib/parent-auth";
import {
  notifyAdminParentSessionReport,
  ParentSessionReportData,
} from "@/lib/parent-email-templates";

export const dynamic = "force-dynamic";

const SessionReportSchema = z.object({
  parentName: z.string().min(1).max(120),
  parentEmail: z.string().email().max(200).optional(),
  childrenNames: z.string().max(400).optional(),
  startTime: z.string().min(1).max(80),
  endTime: z.string().min(1).max(80),
  durationMinutes: z.number().min(0).max(1440),
  actions: z
    .array(
      z.object({
        time: z.string().min(1).max(64),
        text: z.string().min(1).max(500),
      })
    )
    .max(100),
});

const reportRateMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  try {
    const session = await getParentSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = Date.now();
    const rl = reportRateMap.get(session.parentId);
    if (rl && rl.resetAt > now) {
      if (rl.count >= 10) {
        return NextResponse.json(
          { success: false, error: "Too many requests" },
          { status: 429 }
        );
      }
      rl.count += 1;
    } else {
      reportRateMap.set(session.parentId, { count: 1, resetAt: now + 300_000 });
    }

    const rawBody = await req.json();
    const parsed = SessionReportSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const body: ParentSessionReportData = parsed.data;
    if (body.actions.length === 0) {
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
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
