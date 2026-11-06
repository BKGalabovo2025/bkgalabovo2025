import { Skeleton } from "@/components/ui/skeleton";

export default function TripLoading() {
  return (
    <div className="space-y-6 pb-24 duration-300 animate-in fade-in">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-48 rounded-lg" />
        <Skeleton className="h-8 w-96 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      {/* Nav skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Main card skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-44 rounded-2xl md:col-span-2" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
