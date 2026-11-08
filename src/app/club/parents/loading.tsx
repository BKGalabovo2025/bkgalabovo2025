import { Skeleton } from "@/components/ui/skeleton";

export default function ParentPortalLoading() {
  return (
    <div
      className="min-h-screen bg-slate-50/60 px-3 py-4 sm:px-6 sm:py-8 dark:bg-zinc-950"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto max-w-5xl space-y-6 pb-20">
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
    </div>
  );
}
