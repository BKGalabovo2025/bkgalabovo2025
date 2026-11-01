import { Metadata } from "next";

import { TournamentResultsSectionView } from "@/components/tournaments/details/views/TournamentResultsSectionView";

export const metadata: Metadata = {
  title: "Резултати и класиране | Турнир - БК Гълъбово",
  description:
    "Официално класиране, точки за ранглистата, медали и експорт на резултатите в PDF и Excel.",
};

export default function TournamentResultsPage() {
  return <TournamentResultsSectionView />;
}
