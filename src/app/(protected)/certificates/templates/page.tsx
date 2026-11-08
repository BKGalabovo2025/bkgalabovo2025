import type { Metadata } from "next";

import { TemplatesSectionView } from "@/components/certificates/views/TemplatesSectionView";

export const metadata: Metadata = {
  title: "AI Шаблони & Дизайнер | Сертификати | БК Гълъбово",
  description:
    "Визуален и AI дизайнер на шаблони за сертификати, грамоти, дипломи и електронни ваучери.",
};

export default function CertificatesTemplatesPage() {
  return <TemplatesSectionView />;
}
