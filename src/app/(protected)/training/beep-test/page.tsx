import { Metadata } from "next";
import { Suspense } from "react";

import BeepTestClient from "./beep-test-client";

export const metadata: Metadata = {
  title: "Бийп Тест | Провеждане на тест",
  description:
    "Модул за измерване на аеробния капацитет (VO2 Max) на състезателите.",
};

export default function BeepTestPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <BeepTestClient initialTab="new" />
    </Suspense>
  );
}
