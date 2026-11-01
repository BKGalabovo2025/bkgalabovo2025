import { Metadata } from "next";

import { MemberDocumentsTabView } from "@/components/members/profile/views/MemberDocumentsTabView";

export const metadata: Metadata = {
  title: "Документи и бланки | Досие на член - Бадминтон клуб Гълъбово",
  description:
    "Картотека, декларации, медицинско свидетелство и бланки за печат на член на клуба.",
};

export default function MemberDocumentsPage() {
  return <MemberDocumentsTabView />;
}
