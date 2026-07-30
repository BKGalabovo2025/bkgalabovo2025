"use client";

import { AlertCircle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { logSystemError } from "@/lib/actions/error-logging";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Изпращане на грешката към сървъра (който ще я запише в базата и ще прати имейл)
    const logError = async () => {
      try {
        await logSystemError({
          message: error.message || "Непозната грешка (Unhandled Client Error)",
          stack: error.stack,
          path: window.location.pathname,
          context: `Digest: ${error.digest || "N/A"}`,
        });
      } catch (err) {
        console.error("Неуспешно репортване на грешката:", err);
      }
    };

    logError();
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center">
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-red-500/20 bg-zinc-900 p-8">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertCircle size={32} />
        </div>

        <h1 className="mb-3 text-2xl font-semibold text-white">
          Възникна технически проблем
        </h1>

        <p className="mb-8 text-sm text-zinc-400">
          Системата е уведомена автоматично. Моля, опитайте да презаредите
          страницата или се върнете в началото.
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            <RotateCcw size={16} />
            Презареждане
          </button>

          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            <Home size={16} />
            Към началото
          </Link>
        </div>
      </div>
    </div>
  );
}
