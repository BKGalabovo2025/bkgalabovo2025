"use client";

import { Loader2 } from "lucide-react";

export const ProductSaleStep4 = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-20">
      <Loader2 className="size-12 animate-spin text-emerald-500" strokeWidth={2} />
      <div className="space-y-2 text-center">
        <p className="text-lg font-light text-zinc-900 dark:text-zinc-100">
          Регистриране на продажбата...
        </p>
        <p className="text-xs font-light text-zinc-400">
          Моля, изчакайте, докато транзакцията се записва в базата данни.
        </p>
      </div>
    </div>
  );
};
