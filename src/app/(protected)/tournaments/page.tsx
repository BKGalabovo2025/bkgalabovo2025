export const dynamic = "force-dynamic";

import { tournamentService } from "@/services/tournament-service";
import TournamentsClient from "./TournamentsClient";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default async function TournamentsPage() {
  const tournaments = await tournamentService.getTournaments();

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <Suspense fallback={<TournamentsLoading />}>
        <TournamentsClient
          initialTournaments={JSON.parse(JSON.stringify(tournaments))}
        />
      </Suspense>
    </div>
  );
}

function TournamentsLoading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Skeleton className="md:col-span-12 lg:col-span-8 h-48 rounded-2xl" />
        <Skeleton className="md:col-span-6 lg:col-span-2 h-48 rounded-2xl" />
        <Skeleton className="md:col-span-6 lg:col-span-2 h-48 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-64 rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-20 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
