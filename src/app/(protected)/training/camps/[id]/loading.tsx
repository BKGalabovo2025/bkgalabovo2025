import { Skeleton } from "@/components/ui/skeleton";

export default function CampDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 animate-pulse p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Skeleton className="h-96 rounded-2xl md:col-span-1" />
        <div className="space-y-4 md:col-span-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
