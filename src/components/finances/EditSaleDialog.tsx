/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sale } from "@/types";
import { updateSale } from "@/services/sales-service";
import { Label } from "@/components/ui/label";
import { ShoppingBag, CreditCard } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditSaleDialogProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditSaleDialog = ({
  sale,
  isOpen,
  onClose,
  onSuccess,
}: EditSaleDialogProps) => {
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("В брой");
  const [totalAmount, setTotalAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (sale) {
      setIsPaid(sale.isPaid);
      setPaymentMethod(sale.paymentMethod || "В брой");
      setTotalAmount(sale.totalAmount.toString());
    }
  }, [sale]);

  const handleUpdate = async () => {
    if (!sale) return;
    
    const amountVal = parseFloat(totalAmount);
    if (isNaN(amountVal) || amountVal < 0) {
      toast.error("Грешка", {
        description: "Моля, въведете валидна сума.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateSale(sale.id, {
        isPaid,
        paymentMethod,
        totalAmount: amountVal,
      });

      toast.success("Успех!", { description: "Продажбата е обновена успешно." });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Грешка", {
        description: error.message || "Грешка при обновяване на продажбата.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-light text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-500" strokeWidth={1.5} />
            Редакция на продажба
          </DialogTitle>
          <DialogDescription className="font-light text-zinc-400 mt-1">
            Промяна на статуса на плащане и сумата на продажбата.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Статус на плащане
              </span>
              <span className="text-xs text-zinc-500 mt-0.5">
                {isPaid ? "Маркирано като платено" : "Маркирано като неплатено"}
              </span>
            </div>
            <Checkbox
              checked={isPaid}
              onCheckedChange={(checked) => setIsPaid(checked === true)}
              disabled={isProcessing}
              className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Начин на плащане
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              disabled={isProcessing}
            >
              <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-zinc-950">
                <SelectValue placeholder="Изберете начин" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="В брой">В брой</SelectItem>
                <SelectItem value="ПОС терминал">ПОС терминал</SelectItem>
                <SelectItem value="Банков път">Банков път</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              Обща сума (EUR)
              <span className="text-[10px] text-zinc-400 font-normal">
                По подразбиране: {formatPrice(sale.totalAmount)}
              </span>
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CreditCard className="h-4 w-4 text-zinc-400" />
              </div>
              <Input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                disabled={isProcessing}
                className="pl-10 h-11 rounded-xl"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl px-6"
          >
            Отказ
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isProcessing}
            className="rounded-xl px-6 bg-zinc-950 text-white hover:bg-zinc-800"
          >
            {isProcessing ? "Запазване..." : "Запази промените"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
