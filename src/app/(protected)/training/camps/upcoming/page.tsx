import { Metadata } from "next";
import { Suspense } from "react";

import CampsClient from "../CampsClient";

export const metadata: Metadata = {
  title: "Предстоящи лагери | Тренировъчен процес",
  description: "Предстоящи тренировъчни лагери на клуба.",
};

export default function UpcomingCampsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <CampsClient section="upcoming" />
    </Suspense>
  );
}
