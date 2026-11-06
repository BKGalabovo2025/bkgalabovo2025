import { Metadata } from "next";
import { Suspense } from "react";

import TheoryClient from "../theory-client";

export const metadata: Metadata = {
  title: "За проверка | Теория",
  description: "Попълнени тестове, изискващи треньорска рецензия и оценка.",
};

export default function TheoryReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <TheoryClient initialTab="review" />
    </Suspense>
  );
}
