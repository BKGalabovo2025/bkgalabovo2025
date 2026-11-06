import type { Metadata } from "next";

import { CampaignsSectionView } from "@/components/feedback/views/CampaignsSectionView";

export const metadata: Metadata = {
  title: "Анкети & Линкове за обратна връзка | БК Гълъбово",
  description:
    "Генериране и споделяне на линкове за оценка на лагери, турнири и възстановителни процедури.",
};

export default function FeedbackCampaignsPage() {
  return <CampaignsSectionView />;
}
