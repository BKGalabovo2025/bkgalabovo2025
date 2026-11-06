import { Metadata } from "next";
import { Suspense } from "react";

import AssessmentsClient from "../assessments-client";

export const metadata: Metadata = {
  title: "История на оценяването | Оценяване",
  description: "Всички проведени тестове за физически и технически качества.",
};

export default function AssessmentsHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <AssessmentsClient initialTab="history" />
    </Suspense>
  );
}
