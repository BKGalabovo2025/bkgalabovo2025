import { Metadata } from "next";
import { Suspense } from "react";

import TheoryClient from "../theory-client";

export const metadata: Metadata = {
  title: "Конструктор на тест | Теория",
  description: "Създаване на нови викторини и теоретични изпити.",
};

export default function TheoryBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <TheoryClient initialTab="builder" />
    </Suspense>
  );
}
