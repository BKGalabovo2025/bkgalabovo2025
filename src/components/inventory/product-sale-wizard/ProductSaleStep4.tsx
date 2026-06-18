"use client";

import { Loader2 } from "lucide-react";

export const ProductSaleStep4 = () => {
  return (
    <div className="py-20 flex flex-col items-center justify-center space-y-6">
      <Loader2 className="h-12 w-12 animate-spin text-emerald-500" strokeWidth={2} />
      <div className="text-center space-y-2">
        <p className="font-light text-zinc-900 dark:text-zinc-100 text-lg">
          Регистриране на продажбата...
        </p>
        <p className="text-zinc-400 text-xs font-light">
          Моля, изчакайте, докато транзакцията се записва в базата данни.
        </p>
      </div>
    </div>
  );
};
