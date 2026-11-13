"use client";

import { AlertCircle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { logSystemError } from "@/lib/actions/error-logging";

export default function RecoveryZoneError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logSystemError({
      message: error.message || "Грешка в Recovery Zone портала",
      stack: error.stack,
      path: window.location.pathname,
      context: `Digest: ${error.digest || "N/A"}`,
    }).catch((err) => console.error("Неуспешно репортване на грешката:", err));
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white">
      <div
        role="alert"
        className="flex w-full max-w-md flex-col items-center rounded-3xl border border-emerald-500/20 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
          <AlertCircle size={32} />
        </div>

        <h1 className="mb-3 text-2xl font-semibold text-white">
          Възникна технически проблем
        </h1>

        <p className="mb-8 text-sm leading-relaxed text-zinc-400">
          Системата е уведомена автоматично. Моля, опитайте да презаредите
          страницата или се върнете към началния портал.
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            <RotateCcw size={16} />
            Опитай отново
          </button>

          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-emerald-400"
          >
            <Home size={16} />
            Към Портала
          </Link>
        </div>
      </div>
    </div>
  );
}
