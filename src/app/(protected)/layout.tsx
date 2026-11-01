import type { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";

import ProtectedLayoutClient from "./ProtectedLayoutClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Административен център | Бадминтон клуб Гълъбово",
  description:
    "Административна система за управление на състезатели, тренировки, финанси и графици на Бадминтон клуб Гълъбово и Recovery Zone.",
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Verify the session cookie on the server before rendering protected UI or prefetching
  const user = await getAuthUserFromSessionCookie();

  if (!user) {
    // Cannot delete cookies in a Server Component in Next.js 15+
    // Redirect to login page and let client/middleware handle session invalidation
    redirect("/login");
  }

  // 4. Session is valid; render standard client-side protected layout structure
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
