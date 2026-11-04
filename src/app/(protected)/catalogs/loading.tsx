import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Pills Skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-44 rounded-xl" />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
