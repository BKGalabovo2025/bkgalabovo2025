// src/app/(protected)/finances/prices/price-history-dialog.tsx

"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/currency";
import { getPriceHistory } from "@/services/price-service";
import { Price, PriceHistory } from "@/types/index";

interface PriceHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  price: Price;
}

export function PriceHistoryDialog({
  isOpen,
  onClose,
  price,
}: PriceHistoryDialogProps) {
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const data = await getPriceHistory(price.id);
          setHistory(data);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();
  }, [isOpen, price.id]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      );
    }

    if (history.length === 0) {
      return (
        <p className="text-center text-muted-foreground">
          Няма намерена история за тази цена.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString("bg-BG")}
                </p>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Променено от: {entry.userName}
                </p>
              </div>
              <div className="flex items-center space-x-2 font-mono text-sm sm:text-base font-bold">
                <span className="text-rose-600 dark:text-rose-400">
                  {formatPrice(entry.oldValue)}
                </span>
                <ArrowRight className="size-4 text-zinc-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatPrice(entry.newValue)}
                </span>
              </div>
            </div>
            {entry.notes && (
              <p className="mt-2 rounded-lg bg-zinc-100 p-2 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <b>Бележка:</b> {entry.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-xl flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 border-b border-zinc-100 bg-zinc-50/50 p-4 sm:p-5 pr-12 dark:border-zinc-800 dark:bg-zinc-900/40">
          <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
            История на промените: {price.name}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-zinc-500">
            Списък на всички минали промени в стойността на тази услуга или
            стока.
          </DialogDescription>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3 min-h-0">
          {renderContent()}
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-9 sm:h-10 rounded-xl px-5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Затвори
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
