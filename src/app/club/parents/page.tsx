import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getParentSession } from "@/lib/parent-auth";

import ParentPortalClient from "./ParentPortalClient";

export const metadata: Metadata = {
  title: "Родителски портал | БК Гълъбово",
  description:
    "Вход и управление на профила на детето, присъствия и тренировъчен график в Бадминтон Клуб Гълъбово.",
};

export default async function ParentPortalPage() {
  const session = await getParentSession();

  if (!session) {
    redirect("/club/parents/login");
  }

  return (
    <div className="min-h-screen bg-slate-50/60 px-3 py-4 sm:px-6 sm:py-8 dark:bg-zinc-950">
      <ParentPortalClient />
    </div>
  );
}
