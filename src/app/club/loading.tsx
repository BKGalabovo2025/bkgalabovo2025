import { Skeleton } from "@/components/ui/skeleton";

export default function ClubLoading() {
  return (
    <div
      className="min-h-screen bg-zinc-950 text-white"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Header Skeleton */}
      <div className="border-b border-blue-500/20 bg-black/80 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Skeleton className="h-9 w-40 rounded-xl bg-zinc-900" />
          <div className="hidden gap-6 md:flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-20 rounded-md bg-zinc-900" />
            ))}
          </div>
          <Skeleton className="h-9 w-24 rounded-xl bg-zinc-900" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="mx-auto max-w-6xl space-y-12 px-6 py-16">
        <div className="flex flex-col items-center space-y-5 text-center">
          <Skeleton className="h-8 w-56 rounded-full bg-blue-950/40" />
          <Skeleton className="h-16 w-full max-w-2xl rounded-2xl bg-zinc-900" />
          <Skeleton className="h-20 w-full max-w-xl rounded-2xl bg-zinc-900/70" />
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-12 w-48 rounded-xl bg-blue-950/50" />
            <Skeleton className="h-12 w-44 rounded-xl bg-zinc-900" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-72 w-full rounded-3xl border border-blue-500/10 bg-zinc-900/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
