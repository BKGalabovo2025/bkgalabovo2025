import { Skeleton } from "@/components/ui/skeleton";

export default function CertificatesLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      <Skeleton className="h-16 w-full rounded-2xl" />

      <div className="flex gap-2">
        <Skeleton className="h-10 w-44 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
