import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

export function ParentPortalSkeleton() {
  return (
    <div
      className="mx-auto max-w-5xl space-y-6 pb-20"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Header Skeleton */}
      <Skeleton className="h-24 w-full rounded-3xl" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-3xl" />
        ))}
      </div>

      {/* Navigation Bar Skeleton */}
      <Skeleton className="h-14 w-full rounded-2xl" />

      {/* Main View Skeleton */}
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}
