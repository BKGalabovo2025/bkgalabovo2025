// src/app/(protected)/finances/prices/price-history-dialog.tsx

"use client";

import { useEffect, useState } from "react";
import { Price, PriceHistory } from "@/types/index";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPriceHistory } from "@/services/price-service";
import { formatPrice } from "@/lib/currency";
import { Loader2, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <ScrollArea className="h-80 pr-4">
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString("bg-BG")}
                  </p>
                  <p className="font-medium">
                    Променено от: {entry.userName}
                  </p>
                </div>
                <div className="flex items-center space-x-2 font-mono text-lg">
                  <span className="text-red-600">
                    {formatPrice(entry.oldValue)}
                  </span>
                  <ArrowRight className="h-5 w-5" />
                  <span className="text-green-600">
                    {formatPrice(entry.newValue)}
                  </span>
                </div>
              </div>
              {entry.notes && (
                <p className="mt-2 text-sm bg-gray-100 p-2 rounded">
                  <b>Бележка:</b> {entry.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            История на промените за &quot;{price.name}&quot;
          </DialogTitle>
          <DialogDescription>
            Списък на всички минали промени в стойността на тази услуга или
            стока.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Затвори</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
