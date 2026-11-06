import { Metadata } from "next";
import { Suspense } from "react";

import CampsClient from "../CampsClient";

export const metadata: Metadata = {
  title: "Минали лагери | Тренировъчен процес",
  description: "Архив на проведени спортни лагери.",
};

export default function PastCampsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <CampsClient section="past" />
    </Suspense>
  );
}
