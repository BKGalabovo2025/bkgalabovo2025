import type { Metadata } from "next";

import { IssueSectionView } from "@/components/certificates/views/IssueSectionView";

export const metadata: Metadata = {
  title: "Издай ваучер / документ | Сертификати | БК Гълъбово",
  description:
    "Качване на готови клубни ваучери, издаване на грамоти и генериране на електронни QR документи.",
};

export default function CertificatesIndexPage() {
  return <IssueSectionView />;
}
