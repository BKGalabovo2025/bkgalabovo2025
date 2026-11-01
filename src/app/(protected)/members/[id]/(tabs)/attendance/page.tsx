import { Metadata } from "next";

import { MemberAttendanceTabView } from "@/components/members/profile/views/MemberAttendanceTabView";

export const metadata: Metadata = {
  title: "Присъствия на тренировки | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "Хронологичен регистър на присъствията и отсъствията от тренировъчни сесии на клуба.",
};

export default function MemberAttendancePage() {
  return <MemberAttendanceTabView />;
}
