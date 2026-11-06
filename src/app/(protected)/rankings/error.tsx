"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function RankingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RankingsError]", error);
  }, [error]);

  return (
    <div className="flex min-h-100 flex-col items-center justify-center rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-zinc-100">
        Грешка при зареждане на ранглистата
      </h2>
      <p className="mb-6 max-w-md text-sm text-slate-600 dark:text-zinc-400">
        {error.message ||
          "Възникна неочаквана грешка при изчисляване или зареждане на класирането."}
      </p>
      <Button
        onClick={reset}
        variant="outline"
        className="gap-2 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40"
      >
        <RefreshCw className="size-4" />
        Опитай отново
      </Button>
    </div>
  );
}
