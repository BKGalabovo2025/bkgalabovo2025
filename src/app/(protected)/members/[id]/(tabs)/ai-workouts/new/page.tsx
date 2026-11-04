import type { Metadata } from "next";
import React from "react";

import { MemberAiWorkoutNewView } from "@/components/members/profile/views/MemberAiWorkoutNewView";

export const metadata: Metadata = {
  title: "Нова AI тренировъчна програма | Бадминтон клуб Гълъбово",
  description:
    "Генериране на персонализиран AI микроцикъл и тренировъчен план за състезател.",
};

export default function MemberAiWorkoutNewPage() {
  return <MemberAiWorkoutNewView />;
}
