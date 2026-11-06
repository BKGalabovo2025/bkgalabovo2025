import type { Metadata } from "next";

import { SubmissionsSectionView } from "@/components/feedback/views/SubmissionsSectionView";

export const metadata: Metadata = {
  title: "Отзиви от родители и състезатели | БК Гълъбово",
  description:
    "Преглед, филтриране и одобряване на попълнени отзиви за тренировки, лагери и състезания.",
};

export default function FeedbackIndexPage() {
  return <SubmissionsSectionView />;
}
