import { Metadata } from "next";

import { ParentAccountsSectionView } from "@/components/parents/admin/views/ParentAccountsSectionView";

export const metadata: Metadata = {
  title: "Родителски профили | Родителски достъп - БК Гълъбово",
  description:
    "Управление на активни родителски профили и свързани състезатели.",
};

export default function ParentAccountsAliasPage() {
  return <ParentAccountsSectionView />;
}
