import type { Metadata } from "next";

import { RestockSectionView } from "@/components/reports/views/RestockSectionView";

export const metadata: Metadata = {
  title: "Зареждане на инвентар | Справки | БК Гълъбово",
  description:
    "Протокол за критични складови наличности, екипировка и поръчки за презареждане.",
};

export default function ReportsRestockPage() {
  return <RestockSectionView />;
}
