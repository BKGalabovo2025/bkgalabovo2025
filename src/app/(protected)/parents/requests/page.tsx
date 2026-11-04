import { Metadata } from "next";

import { ParentRequestsSectionView } from "@/components/parents/admin/views/ParentRequestsSectionView";

export const metadata: Metadata = {
  title: "Заявки за достъп | Родителски достъп - БК Гълъбово",
  description:
    "Преглед и одобрение на чакащи заявки за регистрация от родители на състезатели.",
};

export default function ParentRequestsPage() {
  return <ParentRequestsSectionView />;
}
