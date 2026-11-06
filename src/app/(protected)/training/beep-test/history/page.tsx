import { Metadata } from "next";
import { Suspense } from "react";

import BeepTestClient from "../beep-test-client";

export const metadata: Metadata = {
  title: "История на резултатите | Бийп Тест",
  description: "История и статистика от всички проведени бийп тестове.",
};

export default function BeepTestHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <BeepTestClient initialTab="history" />
    </Suspense>
  );
}
