import type { Metadata } from "next";

import { AttendeesSectionView } from "@/components/camps/views/AttendeesSectionView";

export const metadata: Metadata = {
  title: "Участници в лагер | Лагери | БК Гълъбово",
  description:
    "Списък със записани състезатели, стаи, капаро, доплащания и застраховки.",
};

export default function CampAttendeesPage() {
  return <AttendeesSectionView />;
}
