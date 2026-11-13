export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { NewBusinessTripClient } from "./NewBusinessTripClient";

export const metadata: Metadata = {
  title: "Създаване / Управление на командировка | Счетоводство",
  description:
    "Създаване и управление на командировки, решения на УС и заповеди по спортни събития.",
};

export default function NewBusinessTripPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-8">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-100 w-full" />
        </div>
      }
    >
      <NewBusinessTripClient />
    </Suspense>
  );
}
