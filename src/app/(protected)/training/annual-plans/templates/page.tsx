import { Metadata } from "next";
import { Suspense } from "react";

import { TemplatesClient } from "@/components/training/annual-plans/TemplatesClient";

export const metadata: Metadata = {
  title: "Тренировъчни шаблони | Едногодишни Планове",
  description: "Готови тренировъчни шаблони за импортиране в сесиите.",
};

export default function AnnualPlansTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <TemplatesClient />
    </Suspense>
  );
}
