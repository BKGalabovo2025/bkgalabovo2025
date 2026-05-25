import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("--- API /api/cron/check-statuses HIT! ---");
  return NextResponse.json({
    message: "Автоматичната проверка завърши успешно (функционалността е опростена).",
    processedCount: 0,
    deactivatedCount: 0,
  });
}
