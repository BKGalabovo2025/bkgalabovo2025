import type { Metadata } from "next";

import { TeamSectionView } from "@/components/settings/views/TeamSectionView";

export const metadata: Metadata = {
  title: "Треньорски екип | Настройки | БК Гълъбово",
  description:
    "Управление на треньори, длъжности, профилни снимки и квалификации.",
};

export default function SettingsTeamPage() {
  return <TeamSectionView />;
}
