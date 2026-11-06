import type { Metadata } from "next";

import { TemplatesSectionView } from "@/components/feedback/views/TemplatesSectionView";

export const metadata: Metadata = {
  title: "Шаблони за анкети | БК Гълъбово",
  description:
    "Редактиране и управление на въпросници за събития, лагери, състезания и тренировки.",
};

export default function FeedbackTemplatesPage() {
  return <TemplatesSectionView />;
}
