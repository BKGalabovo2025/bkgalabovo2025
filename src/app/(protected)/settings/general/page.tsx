import type { Metadata } from "next";

import { GeneralSectionView } from "@/components/settings/views/GeneralSectionView";

export const metadata: Metadata = {
  title: "Общи настройки | Настройки | БК Гълъбово",
  description:
    "Основни системни параметри, клубни данни, контакти и адреси на спортната база.",
};

export default function SettingsGeneralPage() {
  return <GeneralSectionView />;
}
