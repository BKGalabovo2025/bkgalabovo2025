import type { Metadata } from "next";

import { ComposerSectionView } from "@/components/marketing/views/ComposerSectionView";

export const metadata: Metadata = {
  title: "Имейл Кампания | Маркетинг | БК Гълъбово",
  description:
    "Създаване и изпращане на брандирани клубни имейл кампании и персонализирани съобщения.",
};

export default function MarketingComposerPage() {
  return <ComposerSectionView />;
}
