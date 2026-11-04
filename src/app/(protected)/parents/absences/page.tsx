import { Metadata } from "next";

import { ParentAbsencesSectionView } from "@/components/parents/admin/views/ParentAbsencesSectionView";

export const metadata: Metadata = {
  title: "Отсъствия | Родителски достъп - БК Гълъбово",
  description:
    "Преглед на подадени от родители уведомления за отсъствие на състезатели от тренировки.",
};

export default function ParentAbsencesPage() {
  return <ParentAbsencesSectionView />;
}
