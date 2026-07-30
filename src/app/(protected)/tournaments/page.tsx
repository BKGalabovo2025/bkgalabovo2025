export const dynamic = "force-dynamic";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Турнири | Бадминтон клуб Гълъбово",
  description:
    "Всички организирани турнири по бадминтон от БК Гълъбово — активни, приключили и предстоящи. Класирания, схеми и резултати.",
};

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getTournamentsServer } from "@/services/tournament-service.server";
import { Tournament } from "@/types/tournament.types";

import TournamentsClient from "./TournamentsClient";

export default async function TournamentsPage() {
  let tournaments: Tournament[] = [];
  let error = null;

  try {
    tournaments = await getTournamentsServer();
  } catch (err) {
    console.error("Error fetching tournaments:", err);
    error =
      "Неуспешно зареждане на списъка с турнири. Моля, опитайте по-късно.";
  }

  return (
    <div className="pb-12">
      {error ? (
        <div className="rounded-5xl border border-rose-100 bg-rose-50 p-8 text-center">
          <p className="font-medium text-rose-600">{error}</p>
        </div>
      ) : (
        <Suspense fallback={<TournamentsLoading />}>
          <TournamentsClient initialTournaments={tournaments} />
        </Suspense>
      )}
    </div>
  );
}

function TournamentsLoading() {
  return (
    <div className="space-y-8 p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-4xl" />
        ))}
      </div>
    </div>
  );
}
