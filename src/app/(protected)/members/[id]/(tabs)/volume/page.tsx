import { Metadata } from "next";

import { MemberVolumeTabView } from "@/components/members/profile/views/MemberVolumeTabView";

export const metadata: Metadata = {
  title: "Тренировъчен обем | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "Анализ на тренировъчното натоварване, седмични часове и интензитет на подготовка.",
};

export default function MemberVolumePage() {
  return <MemberVolumeTabView />;
}
