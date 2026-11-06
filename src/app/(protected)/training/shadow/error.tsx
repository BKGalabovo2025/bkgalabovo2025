"use client";

import { AlertTriangle } from "lucide-react";
import React, { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ShadowError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shadow module error:", error);
  }, [error]);

  return (
    <div className="flex min-h-90 flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-950 dark:bg-red-950/20">
      <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/50 dark:text-red-400">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
        Възникна грешка в Shadow Training
      </h2>
      <p className="mb-6 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        {error.message || "Неуспешно зареждане на тренировъчния панел."}
      </p>
      <Button onClick={reset} variant="default">
        Опитай отново
      </Button>
    </div>
  );
}
