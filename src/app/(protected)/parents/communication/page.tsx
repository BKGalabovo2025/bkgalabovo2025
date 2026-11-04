import { Metadata } from "next";

import { ParentMessagesSectionView } from "@/components/parents/admin/views/ParentMessagesSectionView";

export const metadata: Metadata = {
  title: "Комуникация с родители | Родителски достъп - БК Гълъбово",
  description: "Дневник на разговори и персонални съобщения с родители.",
};

export default function ParentCommunicationAliasPage() {
  return <ParentMessagesSectionView />;
}
