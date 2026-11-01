import { Metadata } from "next";

import { MemberTheoryTabView } from "@/components/members/profile/views/MemberTheoryTabView";

export const metadata: Metadata = {
  title: "Теория и тестове | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "Резултати от тестове по правилника на бадминтона и тактически викторини.",
};

export default function MemberTheoryPage() {
  return <MemberTheoryTabView />;
}
