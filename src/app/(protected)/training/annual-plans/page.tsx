import { Metadata } from "next";
import { Suspense } from "react";

import AnnualPlansClient from "./annual-plans-client";

export const metadata: Metadata = {
  title: "Годишни макроцикли | Едногодишни Планове",
  description: "BWF Периодизация и тренировъчни програми (Macrocycles).",
};

export default function AnnualPlansPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <AnnualPlansClient />
    </Suspense>
  );
}
