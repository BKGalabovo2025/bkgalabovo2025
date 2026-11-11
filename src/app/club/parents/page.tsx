import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getParentDashboardDataAction } from "@/lib/actions/parent-portal";
import { getParentSession } from "@/lib/parent-auth";

import ParentPortalClient from "./ParentPortalClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Родителски портал | БК Гълъбово",
  description:
    "Вход и управление на профила на детето, присъствия и тренировъчен график в Бадминтон Клуб Гълъбово.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ParentPortalPage() {
  const session = await getParentSession();

  if (!session) {
    redirect("/club/parents/login");
  }

  const initialRes = await getParentDashboardDataAction();
  const initialData = initialRes?.success ? initialRes.data : undefined;

  return (
    <div className="min-h-screen bg-slate-50/60 px-3 py-4 sm:px-6 sm:py-8 dark:bg-zinc-950">
      <ParentPortalClient initialData={initialData} />
    </div>
  );
}
