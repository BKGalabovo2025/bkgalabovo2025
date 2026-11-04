import { Metadata } from "next";

import { ParentMessagesSectionView } from "@/components/parents/admin/views/ParentMessagesSectionView";

export const metadata: Metadata = {
  title: "Индивидуална комуникация | Родителски достъп - БК Гълъбово",
  description:
    "Дневник на проведени телефонни разговори и целеви персонални съобщения с родители.",
};

export default function ParentMessagesPage() {
  return <ParentMessagesSectionView />;
}
