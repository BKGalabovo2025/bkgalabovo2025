import { Metadata } from "next";
import { Suspense } from "react";

import PlannerClient from "../planner-client";

export const metadata: Metadata = {
  title: "Архив на сесиите | Планировчик",
  description: "Архив на проведени и завършени тренировъчни сесии.",
};

export default function PlannerArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <PlannerClient initialTab="archive" />
    </Suspense>
  );
}
