import { Skeleton } from "@/components/ui/skeleton";

export default function DeclarationsLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
