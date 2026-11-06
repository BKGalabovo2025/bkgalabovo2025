import type { Metadata } from "next";

import { IssuedSectionView } from "@/components/certificates/views/IssuedSectionView";

export const metadata: Metadata = {
  title: "Издадени сертификати и ваучери | БК Гълъбово",
  description:
    "Регистър на всички издадени електронни ваучери, грамоти, QR верификация и статуси.",
};

export default function CertificatesIssuedPage() {
  return <IssuedSectionView />;
}
