"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard section error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200/60 bg-rose-50/30 p-8 sm:p-12 text-center dark:border-rose-900/40 dark:bg-rose-950/10">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
        Възникна проблем при зареждане на таблото
      </h2>
      <p className="mt-1.5 max-w-md text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {error.message ||
          "Не можахме да заредим тази секция от таблото за управление. Опитайте отново или опреснете данните."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button
          onClick={() => reset()}
          size="sm"
          className="rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 text-xs font-semibold"
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
          <Link href="/dashboard">Към общ преглед</Link>
        </Button>
      </div>
    </div>
  );
}
