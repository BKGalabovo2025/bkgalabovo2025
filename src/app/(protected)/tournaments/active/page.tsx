export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getTournamentsServer } from "@/services/tournament-service.server";
import { Tournament } from "@/types/tournament.types";

import TournamentsClient from "../TournamentsClient";

export const metadata: Metadata = {
  title: "Активни турнири | Бадминтон клуб Гълъбово",
  description:
    "Всички активни турнири по бадминтон със записване, предстоящи или в ход.",
};

export default async function ActiveTournamentsPage() {
  let tournaments: Tournament[] = [];
  try {
    tournaments = await getTournamentsServer();
  } catch (err) {
    console.error("Error fetching active tournaments:", err);
  }

  return (
    <div className="pb-12">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <TournamentsClient initialTournaments={tournaments} section="active" />
      </Suspense>
    </div>
  );
}
