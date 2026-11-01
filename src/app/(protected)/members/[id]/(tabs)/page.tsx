import { Metadata } from "next";

import { MemberPersonalTabView } from "@/components/members/profile/views/MemberPersonalTabView";

export const metadata: Metadata = {
  title: "Лични данни | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "Детайлен преглед на личните данни, контакти и семеен профил на член на клуба.",
};

export default function MemberDefaultProfilePage() {
  return <MemberPersonalTabView />;
}
