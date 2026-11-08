import type { Metadata } from "next";

import { StudioSectionView } from "@/components/certificates/views/StudioSectionView";

export const metadata: Metadata = {
  title: "Студио за издаване | Сертификати | БК Гълъбово",
  description:
    "Издаване на грамоти, дипломи и ваучери по шаблон за състезатели, турнири и клубни лагери.",
};

export default function CertificatesStudioPage() {
  return <StudioSectionView />;
}
