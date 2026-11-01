import { Metadata } from "next";

import { MemberSalesTabView } from "@/components/members/profile/views/MemberSalesTabView";

export const metadata: Metadata = {
  title: "Финансова история | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "История на заплатените такси, абонаменти, издадени документи и плащания на член на клуба.",
};

export default function MemberSalesPage() {
  return <MemberSalesTabView />;
}
