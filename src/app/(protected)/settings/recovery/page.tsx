import type { Metadata } from "next";

import { RecoverySectionView } from "@/components/settings/views/RecoverySectionView";

export const metadata: Metadata = {
  title: "Зона Възстановяване | Настройки | БК Гълъбово",
  description: "Настройки на параметрите и услугите на Recovery Zone by ZM.",
};

export default function SettingsRecoveryPage() {
  return <RecoverySectionView />;
}
