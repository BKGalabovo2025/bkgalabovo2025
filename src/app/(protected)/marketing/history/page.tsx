import type { Metadata } from "next";

import { HistorySectionView } from "@/components/marketing/views/HistorySectionView";

export const metadata: Metadata = {
  title: "История и Дневник | Маркетинг | БК Гълъбово",
  description:
    "Пълен хронологичен регистър на комуникацията, изпратените имейли и проведените разговори.",
};

export default function MarketingHistoryPage() {
  return <HistorySectionView />;
}
