import type { Metadata } from "next";

import { BackupSectionView } from "@/components/settings/views/BackupSectionView";

export const metadata: Metadata = {
  title: "Резервен архив | Настройки | БК Гълъбово",
  description:
    "Генериране и изтегляне на пълен резервен архив на клубните бази и настройки.",
};

export default function SettingsBackupPage() {
  return <BackupSectionView />;
}
