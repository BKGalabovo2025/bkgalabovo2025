import type { Metadata } from "next";

import { LiabilitiesSectionView } from "@/components/reports/views/LiabilitiesSectionView";

export const metadata: Metadata = {
  title: "Задължения и неплатени такси | Справки | БК Гълъбово",
  description:
    "Справка за невнесени месечни абонаменти, такси и просрочени задължения на състезатели.",
};

export default function ReportsLiabilitiesPage() {
  return <LiabilitiesSectionView />;
}
