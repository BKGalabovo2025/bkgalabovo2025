import { Metadata } from "next";

import { ParentRequestsSectionView } from "@/components/parents/admin/views/ParentRequestsSectionView";

export const metadata: Metadata = {
  title: "Чакащи заявки | Родителски достъп - БК Гълъбово",
  description: "Преглед на чакащи одобрение заявки за родителски профили.",
};

export default function ParentPendingPage() {
  return <ParentRequestsSectionView />;
}
