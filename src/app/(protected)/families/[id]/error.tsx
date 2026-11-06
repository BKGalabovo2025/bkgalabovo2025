"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function FamilyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Грешка при зареждане на семеен профил:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-200 bg-white p-8 shadow-xs dark:border-rose-900/50 dark:bg-zinc-950">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
          Възникна проблем при зареждане на семейния профил
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {error.message || "Неуспешна връзка с базата данни."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            size="sm"
            className="rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            Опитай отново
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
          >
            <Link href="/members">Към членовете</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
