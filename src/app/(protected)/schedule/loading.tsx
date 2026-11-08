import { Skeleton } from "@/components/ui/skeleton";

export default function ScheduleLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}
