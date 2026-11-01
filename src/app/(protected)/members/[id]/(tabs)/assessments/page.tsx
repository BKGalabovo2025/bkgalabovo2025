import { Metadata } from "next";

import { MemberAssessmentsTabView } from "@/components/members/profile/views/MemberAssessmentsTabView";

export const metadata: Metadata = {
  title: "Оценяване и нормативи | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "Треньорски оценки, физически нормативи и тестови показатели на състезателя.",
};

export default function MemberAssessmentsPage() {
  return <MemberAssessmentsTabView />;
}
