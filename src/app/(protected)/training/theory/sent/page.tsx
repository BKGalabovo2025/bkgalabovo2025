import { Metadata } from "next";
import { Suspense } from "react";

import TheoryClient from "../theory-client";

export const metadata: Metadata = {
  title: "Изпратени тестове | Теория",
  description: "Списък с изпратени линкове за попълване на тестове.",
};

export default function TheorySentPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <TheoryClient initialTab="sent" />
    </Suspense>
  );
}
