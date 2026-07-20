import { Trophy } from "lucide-react";

export default function RankingsLoading() {
  return (
    <div className="flex h-[80vh] items-center justify-center py-32">
      <div className="space-y-4 text-center">
        <div className="relative inline-block">
          <Trophy className="mx-auto size-16 text-yellow-500/20" />
          <Trophy className="absolute inset-0 mx-auto size-16 animate-pulse text-yellow-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Ранглиста</h2>
          <p className="animate-pulse text-muted-foreground">
            Изчисляване на точките и позициите...
          </p>
        </div>
      </div>
    </div>
  );
}
