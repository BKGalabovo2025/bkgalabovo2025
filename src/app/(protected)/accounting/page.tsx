export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import AccountingClient from "./AccountingClient";

export const metadata: Metadata = {
  title: "Счетоводни отчети | Бадминтон клуб Гълъбово",
  description:
    "Глобален преглед на всички транспортни разходи и командировки. Месечни отчети и експорт.",
};

export default function AccountingPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-8">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-100 w-full" />
        </div>
      }
    >
      <AccountingClient />
    </Suspense>
  );
}
