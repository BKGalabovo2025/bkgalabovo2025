import { Metadata } from "next";

import { ParentActivitySectionView } from "@/components/parents/admin/views/ParentActivitySectionView";

export const metadata: Metadata = {
  title: "Активност на живо & Дневник | Родителски достъп - БК Гълъбово",
  description:
    "Следене в реално време на онлайн родители, последен успешен вход и история на активността в портала.",
};

export default function ParentActivityPage() {
  return <ParentActivitySectionView />;
}
