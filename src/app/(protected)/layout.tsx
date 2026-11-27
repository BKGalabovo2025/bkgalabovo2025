import type { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

import { ensureAdminFromSession } from "@/lib/auth-utils";

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
  // 1. Verify the session cookie and admin role on the server before rendering protected UI
  try {
    await ensureAdminFromSession();
  } catch {
    redirect("/login");
  }

  // 4. Session is valid; render standard client-side protected layout structure
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
