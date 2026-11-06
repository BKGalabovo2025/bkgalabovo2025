import { Metadata } from "next";
import { Suspense } from "react";

import TheoryClient from "../theory-client";

export const metadata: Metadata = {
  title: "История на резултатите | Теория",
  description: "Всички проверени викторини и анализи.",
};

export default function TheoryHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <TheoryClient initialTab="history" />
    </Suspense>
  );
}
