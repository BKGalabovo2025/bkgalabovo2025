import { Skeleton } from "@/components/ui/skeleton";

export default function MembersListLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}
