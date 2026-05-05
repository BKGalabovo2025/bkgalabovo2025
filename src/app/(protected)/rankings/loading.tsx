import { Trophy } from "lucide-react";

export default function RankingsLoading() {
  return (
    <div className="flex items-center justify-center py-32 h-[80vh]">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Trophy className="h-16 w-16 mx-auto text-yellow-500/20" />
          <Trophy className="h-16 w-16 mx-auto text-yellow-500 absolute inset-0 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Ранглиста</h2>
          <p className="text-muted-foreground animate-pulse">
            Изчисляване на точките и позициите...
          </p>
        </div>
      </div>
    </div>
  );
}
