import type { Metadata } from "next";

import { AnnualSectionView } from "@/components/reports/views/AnnualSectionView";

export const metadata: Metadata = {
  title: "Годишен отчет за дейността | Справки | БК Гълъбово",
  description:
    "Официален годишен отчет за дейността на треньора и клуба: тренировки, турнири, лагери и спечелени медали.",
};

export default function ReportsAnnualPage() {
  return <AnnualSectionView />;
}
