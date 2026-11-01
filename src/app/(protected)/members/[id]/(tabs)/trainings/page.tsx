import { Metadata } from "next";

import { MemberTrainingsTabView } from "@/components/members/profile/views/MemberTrainingsTabView";

export const metadata: Metadata = {
  title: "Shadow тренировки | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "История на тренировките на Shadow тренажора, бързина и показатели на състезателя.",
};

export default function MemberTrainingsPage() {
  return <MemberTrainingsTabView />;
}
