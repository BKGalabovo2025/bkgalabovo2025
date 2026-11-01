import { Metadata } from "next";

import { TournamentBracketSectionView } from "@/components/tournaments/details/views/TournamentBracketSectionView";

export const metadata: Metadata = {
  title: "Турнирна схема | Турнир - БК Гълъбово",
  description:
    "Визуална турнирна схема, жребий и прогрес на срещите по кръгове и категории.",
};

export default function TournamentBracketPage() {
  return <TournamentBracketSectionView />;
}
