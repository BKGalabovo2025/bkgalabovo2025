import React from "react";

export default function DocumentsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/60" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-56 rounded-2xl border border-zinc-200/80 bg-zinc-100/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
          />
        ))}
      </div>
    </div>
  );
}
