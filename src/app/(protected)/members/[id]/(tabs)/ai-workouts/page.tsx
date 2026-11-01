import { Metadata } from "next";

import { MemberAiWorkoutsTabView } from "@/components/members/profile/views/MemberAiWorkoutsTabView";

export const metadata: Metadata = {
  title: "AI Тренировъчни програми | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "Индивидуални тренировъчни планове и програми, генерирани от изкуствен интелект.",
};

export default function MemberAiWorkoutsPage() {
  return <MemberAiWorkoutsTabView />;
}
