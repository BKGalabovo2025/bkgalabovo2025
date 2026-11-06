import type { Metadata } from "next";

import { AuditSectionView } from "@/components/settings/views/AuditSectionView";

export const metadata: Metadata = {
  title: "Системни логове | Настройки | БК Гълъбово",
  description:
    "Одитни записи на влизания, промени, изтривания и операции по сигурността.",
};

export default function SettingsAuditPage() {
  return <AuditSectionView />;
}
