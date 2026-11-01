import { Metadata } from "next";

import { TournamentMatchesSectionView } from "@/components/tournaments/details/views/TournamentMatchesSectionView";

export const metadata: Metadata = {
  title: "Мачове и програма | Турнир - БК Гълъбово",
  description:
    "Пълен график на предстоящите и изиграните срещи от турнира по система Бергер с резултати.",
};

export default function TournamentMatchesPage() {
  return <TournamentMatchesSectionView />;
}
