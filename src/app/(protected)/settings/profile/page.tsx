import type { Metadata } from "next";

import { ProfileSectionView } from "@/components/settings/views/ProfileSectionView";

export const metadata: Metadata = {
  title: "Личен профил | Настройки | БК Гълъбово",
  description:
    "Профилна информация на администратора, име, контактен имейл и роля в клуба.",
};

export default function SettingsProfilePage() {
  return <ProfileSectionView />;
}
