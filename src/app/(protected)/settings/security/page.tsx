import type { Metadata } from "next";

import { SecuritySectionView } from "@/components/settings/views/SecuritySectionView";

export const metadata: Metadata = {
  title: "Сигурност и Защита | Настройки | БК Гълъбово",
  description:
    "Управление на пароли, двуфакторна автентикация, сесии и политики за сигурност.",
};

export default function SettingsSecurityPage() {
  return <SecuritySectionView />;
}
