import { Metadata } from "next";

import { ParentCorrectionsSectionView } from "@/components/parents/admin/views/ParentCorrectionsSectionView";

export const metadata: Metadata = {
  title: "Корекции на данни | Родителски достъп - БК Гълъбово",
  description:
    "Заявки от родители за корекция на лични данни в картоните на състезателите с 1-клик одобрение.",
};

export default function ParentCorrectionsPage() {
  return <ParentCorrectionsSectionView />;
}
