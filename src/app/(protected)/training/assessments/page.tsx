import { Metadata } from "next";
import { Suspense } from "react";

import AssessmentsClient from "./assessments-client";

export const metadata: Metadata = {
  title: "BWF Тестове и Бланки | Оценяване",
  description:
    "Бадминтон тестове по методиката на BWF за различни възрастови групи.",
};

export default function AssessmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <AssessmentsClient initialTab="bwf" />
    </Suspense>
  );
}
