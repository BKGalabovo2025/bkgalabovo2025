"use client";

import { AlertCircle, RotateCcw, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { logSystemError } from "@/lib/actions/error-logging";

export default function MembersListError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logSystemError({
      message: error.message || "Грешка при зареждане на членовете:",
      stack: error.stack,
      path: window.location.pathname,
      context: `Digest: ${error.digest || "N/A"}`,
    }).catch((err) => console.error("Неуспешно репортване на грешката:", err));
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/20"
    >
      <AlertCircle className="size-10 text-red-600" />
      <h2 className="text-lg font-semibold">
        Списъкът с членове не можа да се зареди
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Системата е уведомена автоматично. Опитайте отново или се върнете към
        началното табло.
      </p>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button onClick={() => reset()} className="flex-1 gap-2">
          <RotateCcw className="size-4" />
          Опитай отново
        </Button>
        <Button asChild variant="outline" className="flex-1 gap-2">
          <Link href="/dashboard">
            <Shield className="size-4" />
            Към таблото
          </Link>
        </Button>
      </div>
    </div>
  );
}
