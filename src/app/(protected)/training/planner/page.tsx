import { Metadata } from "next";
import { Suspense } from "react";

import PlannerClient from "./planner-client";

export const metadata: Metadata = {
  title: "Предстоящи тренировки | Планировчик",
  description: "График на предстоящи тренировъчни сесии.",
};

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <PlannerClient initialTab="upcoming" />
    </Suspense>
  );
}
