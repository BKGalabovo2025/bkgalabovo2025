import { Metadata } from "next";

import { TournamentParticipantsSectionView } from "@/components/tournaments/details/views/TournamentParticipantsSectionView";

export const metadata: Metadata = {
  title: "Участници | Турнир - БК Гълъбово",
  description:
    "Списък с всички регистрирани участници, категории и състезателни двойки в турнира.",
};

export default function TournamentParticipantsPage() {
  return <TournamentParticipantsSectionView />;
}
