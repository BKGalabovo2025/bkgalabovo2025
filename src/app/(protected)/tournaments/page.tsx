export const dynamic = "force-dynamic";

import TournamentsClient from "./TournamentsClient";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

export default function TournamentsPage() {
  const tournaments: any[] = [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Турнири и състезания"
        description="Организиране на спортни събития, управление на участници, схеми и класиране в реално време."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Турнири" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-[32px] shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-0">
          <Suspense fallback={<TournamentsLoading />}>
            <TournamentsClient
              initialTournaments={JSON.parse(JSON.stringify(tournaments))}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function TournamentsLoading() {
  return (
    <div className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-[32px]" />
        ))}
      </div>
    </div>
  );
}
