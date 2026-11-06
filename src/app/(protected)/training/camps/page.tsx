import { Metadata } from "next";
import { Suspense } from "react";

import CampsClient from "./CampsClient";

export const metadata: Metadata = {
  title: "Всички лагери | Тренировъчен процес",
  description: "Управление и преглед на всички планирани лагери.",
};

export default function CampsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <CampsClient section="all" />
    </Suspense>
  );
}
