"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-zinc-900 border border-red-500/20 rounded-3xl p-8 max-w-md w-full flex flex-col items-center">
        <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={32} />
        </div>

        <h1 className="text-2xl font-semibold text-white mb-3">
          Възникна технически проблем
        </h1>

        <p className="text-zinc-400 text-sm mb-8">
          Системата е уведомена автоматично. Моля, опитайте да презаредите
          страницата или се върнете в началото.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-4 rounded-xl text-sm font-medium transition-colors"
          >
            <RotateCcw size={16} />
            Презареждане
          </button>

          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl text-sm font-medium transition-colors"
          >
            <Home size={16} />
            Към началото
          </Link>
        </div>
      </div>
    </div>
  );
}
