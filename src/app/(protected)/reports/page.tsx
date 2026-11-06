import type { Metadata } from "next";

import { FinancialSectionView } from "@/components/reports/views/FinancialSectionView";

export const metadata: Metadata = {
  title: "Финансов отчет | Справки | БК Гълъбово",
  description:
    "Обобщен финансов отчет за приходи от такси, продажби, тренировки и салда.",
};

export default function ReportsIndexPage() {
  return <FinancialSectionView />;
}
