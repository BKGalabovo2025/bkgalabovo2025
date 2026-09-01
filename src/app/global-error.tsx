"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="bg">
      <body className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-white">
        <div className="max-w-md space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <span className="text-2xl font-black">!</span>
          </div>
          <h1 className="text-xl font-black">Възникна непредвидена грешка</h1>
          <p className="text-xs text-zinc-400">
            Системата записа събитието в сървърните логове. Моля, опитайте
            отново.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            Презареждане
          </button>
        </div>
      </body>
    </html>
  );
}
