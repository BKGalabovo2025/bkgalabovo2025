import { Metadata } from "next";

import { MemberParentsTabView } from "@/components/members/profile/views/MemberParentsTabView";

export const metadata: Metadata = {
  title: "Родителски достъп | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "Управление на родителския достъп, свързани родители и PIN кодове за вход.",
};

export default function MemberParentsPage() {
  return <MemberParentsTabView />;
}
