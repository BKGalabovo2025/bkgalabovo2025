import DashboardClient from "./DashboardClient";
import { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Табло - Бадминтон клуб Гълъбово",
  description:
    "Общ преглед на активността, членовете и финансовите показатели на клуба.",
};

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse pb-12 w-full">
      <div className="h-32 bg-zinc-100 dark:bg-zinc-900 rounded-3xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-40 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
        <Skeleton className="h-40 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
        <Skeleton className="h-40 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
        <Skeleton className="h-40 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 w-full">
      <div className="px-0 w-full">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardClient />
        </Suspense>
      </div>
    </div>
  );
}
