import type { Metadata } from "next";

import { TemplatesSectionView } from "@/components/marketing/views/TemplatesSectionView";

export const metadata: Metadata = {
  title: "Шаблони за съобщения | Маркетинг | БК Гълъбово",
  description:
    "Готови текстови шаблони за изпращане на покани, такси, графици и известия.",
};

export default function MarketingTemplatesPage() {
  return <TemplatesSectionView />;
}
