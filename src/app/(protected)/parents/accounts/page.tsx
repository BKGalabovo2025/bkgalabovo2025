import { Metadata } from "next";

import { ParentAccountsSectionView } from "@/components/parents/admin/views/ParentAccountsSectionView";

export const metadata: Metadata = {
  title: "Родителски профили | Родителски достъп - БК Гълъбово",
  description:
    "Списък и управление на активни родителски профили, свързване на състезатели, права и изпращане на документи.",
};

export default function ParentAccountsPage() {
  return <ParentAccountsSectionView />;
}
