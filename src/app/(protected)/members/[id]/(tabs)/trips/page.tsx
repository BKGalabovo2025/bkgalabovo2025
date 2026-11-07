import { Metadata } from "next";

import { MemberTripsTabView } from "@/components/members/profile/views/MemberTripsTabView";

export const metadata: Metadata = {
  title: "Командировки & Състезания | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "Участия в състезания, лагери, командировки, ведомости за дневни пари и финансови отчети.",
};

export default function MemberTripsPage() {
  return <MemberTripsTabView />;
}
