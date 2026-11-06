"use client";

import { useReportsContext } from "@/components/reports/ReportsContext";
import RestockReport from "@/components/reports/restock-report";

export function RestockSectionView() {
  const { initialRestockProducts } = useReportsContext();

  return <RestockReport initialProducts={initialRestockProducts} />;
}
