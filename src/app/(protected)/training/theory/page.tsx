import { Metadata } from "next";
import { Suspense } from "react";

import TheoryClient from "./theory-client";

export const metadata: Metadata = {
  title: "Библиотека с тестове | Теория",
  description: "Официални тестове и правила за бадминтон.",
};

export default function TheoryPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <TheoryClient initialTab="library" />
    </Suspense>
  );
}
