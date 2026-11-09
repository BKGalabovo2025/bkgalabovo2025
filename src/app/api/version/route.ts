import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const commit =
    process.env.COMMIT_REF ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    "dev";

  return NextResponse.json({
    commit,
    timestamp: new Date().toISOString(),
  });
}
