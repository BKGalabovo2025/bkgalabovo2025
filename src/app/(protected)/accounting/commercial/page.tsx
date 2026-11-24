export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import AccountingClient from "../AccountingClient";

export const metadata: Metadata = {
  title: "Стопанска дейност | Счетоводни отчети",
  description:
    "Командировки и разходи по стопанска дейност с месечни отчети и експорт.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <AccountingClient section="commercial" />
    </Suspense>
  );
}
