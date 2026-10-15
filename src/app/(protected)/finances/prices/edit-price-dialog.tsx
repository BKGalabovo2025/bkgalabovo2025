"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { updatePrice } from "@/services/price-service";
import { Price } from "@/types/index";

interface EditPriceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  price: Price;
  onPriceUpdated: (updatedPrice: Price) => void;
}

export function EditPriceDialog({
  isOpen,
  onClose,
  price,
  onPriceUpdated,
}: EditPriceDialogProps) {
  const [newValue, setNewValue] = useState(price.value); // Display in EUR directly
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Грешка", {
        description: "Трябва да сте влезли, за да извършите тази операция.",
      });
      return;
    }

    const newValueRounded = Math.round(newValue);
    if (isNaN(newValueRounded) || newValueRounded < 0) {
      toast.error("Грешка", {
        description: "Моля, въведете валидна положителна цена.",
      });
      return;
    }

    startTransition(async () => {
      try {
        await updatePrice(price.id, newValueRounded, user, notes);

        const updatedPriceData: Price = {
          ...price,
          value: newValueRounded,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            userId: user.uid,
            userName: user.displayName || user.email || "System",
          },
        };

        toast.success("Успех!", {
          description: `Цената на "${price.name}" беше актуализирана.`,
        });
        onPriceUpdated(updatedPriceData);
        onClose();
      } catch (error) {
        console.error(error);
        toast.error("Грешка", {
          description: "Възникна грешка при актуализиране на цената.",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-md flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 border-b border-zinc-100 bg-zinc-50/50 p-4 sm:p-5 pr-12 dark:border-zinc-800 dark:bg-zinc-900/40">
          <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Редактиране на цена
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-zinc-500">
            Актуализирайте стойността на цената и добавете бележка за промяната.
          </DialogDescription>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 min-h-0">
          <div>
            <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              {price.name}
            </p>
            {price.description && (
              <p className="text-xs text-zinc-500">{price.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Текуща цена:
            </Label>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {formatPrice(price.value)}
            </span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-price" className="text-xs font-semibold">
              Нова цена (в {price.currency}):
            </Label>
            <Input
              id="new-price"
              type="number"
              step="1"
              value={newValue}
              onChange={(e) => setNewValue(parseInt(e.target.value, 10))}
              className="h-10 rounded-xl text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Причина за промяната (бележки):
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Напр. 'Промяна съгласно решение на УС от 01.01.2024'"
              className="rounded-xl text-xs"
              rows={3}
            />
          </div>
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            className="h-9 sm:h-10 rounded-xl px-4 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Отказ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="h-9 sm:h-10 rounded-xl bg-zinc-900 px-5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Запази промяната
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
