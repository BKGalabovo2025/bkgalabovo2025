export const dynamic = "force-dynamic";

import { Tournament } from "@/types/tournament.types";
import TournamentsClient from "./TournamentsClient";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTournamentsServer } from "@/services/tournament-service.server";

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
        <div className="bg-rose-50 border border-rose-100 rounded-5xl p-8 text-center">
          <p className="text-rose-600 font-medium">{error}</p>
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
    <div className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-4xl" />
        ))}
      </div>
    </div>
  );
}
