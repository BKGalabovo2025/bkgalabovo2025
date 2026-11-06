export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getTournamentsServer } from "@/services/tournament-service.server";
import { Tournament } from "@/types/tournament.types";

import TournamentsClient from "../TournamentsClient";

export const metadata: Metadata = {
  title: "Приключили турнири (Архив) | Бадминтон клуб Гълъбово",
  description:
    "Архив на приключилите турнири по бадминтон от БК Гълъбово. Резултати и класирания.",
};

export default async function CompletedTournamentsPage() {
  let tournaments: Tournament[] = [];
  try {
    tournaments = await getTournamentsServer();
  } catch (err) {
    console.error("Error fetching completed tournaments:", err);
  }

  return (
    <div className="pb-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <TournamentsClient
          initialTournaments={tournaments}
          section="completed"
        />
      </Suspense>
    </div>
  );
}
