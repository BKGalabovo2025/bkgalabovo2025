import type { Metadata } from "next";

import { BrandingSectionView } from "@/components/settings/views/BrandingSectionView";

export const metadata: Metadata = {
  title: "Брандиране | Настройки | БК Гълъбово",
  description:
    "Визуална идентичност, логота, клубни цветове и оформление на спортния клуб.",
};

export default function SettingsBrandingPage() {
  return <BrandingSectionView />;
}
