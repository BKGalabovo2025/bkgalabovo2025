import { Skeleton } from "@/components/ui/skeleton";

export default function AnnualPlansLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-72 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
