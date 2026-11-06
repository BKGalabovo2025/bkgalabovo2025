import type { Metadata } from "next";

import { AutomationsSectionView } from "@/components/marketing/views/AutomationsSectionView";

export const metadata: Metadata = {
  title: "Автоматизации | Маркетинг | БК Гълъбово",
  description:
    "Автоматични съобщения за рождени дни, напомняния за членски внос и известия.",
};

export default function MarketingAutomationsPage() {
  return <AutomationsSectionView />;
}
