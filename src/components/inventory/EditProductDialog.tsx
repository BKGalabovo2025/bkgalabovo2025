"use client";

import { useState } from "react";
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
import { Product } from "@/types";
import {
  restockProductAction,
  updateProductPriceAction,
  adjustProductStockAction,
} from "@/lib/actions/inventory";
import { useAuth } from "@/context/auth-context";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/currency";

interface EditProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdate: () => void;
}

export const EditProductDialog = ({
  product,
  isOpen,
  onClose,
  onProductUpdate,
}: EditProductDialogProps) => {
  const [restockAmount, setRestockAmount] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { idToken } = useAuth();

  const handleRestock = async () => {
    if (!product || !restockAmount || !idToken) return;
    const amount = parseInt(restockAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Грешка", {
        description:
          "Моля, въведете валидно положително число за презареждане.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await restockProductAction(product.id, idToken, amount);

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при презареждане", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
      setRestockAmount("");
    }
  };

  const handleAdjustment = async () => {
    if (!product || !adjustmentAmount || !idToken) return;
    const amount = parseInt(adjustmentAmount, 10);

    if (isNaN(amount) || amount === 0) {
      toast.error("Грешка", {
        description: "Моля, въведете валидно, ненулево число за корекция.",
      });
      return;
    }

    if (amount < 0 && !adjustmentNotes) {
      toast.error("Грешка", {
        description: "При отписване на количества, бележката е задължителна.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // For the server action, we send the new target stock if it's "adjustment"
      // but the action adjustProductStockAction takes newStock.
      // Wait, our local service was taking "amount" (change).
      // Let's check adjustProductStockAction again. It takes newStock.
      const newStock = product.stock + amount;
      const result = await adjustProductStockAction(
        product.id,
        idToken,
        newStock,
        adjustmentNotes
      );

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при корекция", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
      setAdjustmentAmount("");
      setAdjustmentNotes("");
    }
  };

  const handlePriceUpdate = async () => {
    if (!product || !newPrice || !idToken) return;
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Грешка", {
        description: "Моля, въведете валидна, неотрицателна цена.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await updateProductPriceAction(product.id, idToken, price);

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при актуализация на цената", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
      setNewPrice("");
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Редактиране на: {product.name}</DialogTitle>
          <DialogDescription>
            Текуща наличност: <strong>{product.stock} бр.</strong> | Текуща
            цена: <strong>{formatPrice(product.price)}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 gap-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Презареждане</h3>
            <div className="flex items-center space-x-2">
              <Input
                id="restock-amount"
                type="number"
                placeholder="Количество (напр. 10)"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                disabled={isProcessing}
              />
              <Button
                onClick={handleRestock}
                disabled={isProcessing || !restockAmount}
              >
                Презареди
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          <div className="space-y-2">
            <h3 className="font-semibold">Корекция / Отписване</h3>
            <p className="text-sm text-gray-500">
              Използвайте отрицателно число за отписване (напр. -5).
            </p>
            <div className="flex items-center space-x-2">
              <Input
                id="adjustment-amount"
                type="number"
                placeholder="Количество"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                disabled={isProcessing}
              />
              <Button
                onClick={handleAdjustment}
                disabled={isProcessing || !adjustmentAmount}
              >
                Коригирай
              </Button>
            </div>
            <Textarea
              id="adjustment-notes"
              placeholder="Причина (задължително при отписване)..."
              value={adjustmentNotes}
              onChange={(e) => setAdjustmentNotes(e.target.value)}
              disabled={isProcessing}
              className="mt-2"
            />
          </div>

          <div className="border-t border-gray-200"></div>

          <div className="space-y-2">
            <h3 className="font-semibold">Актуализация на цена</h3>
            <div className="flex items-center space-x-2">
              <Input
                id="new-price"
                type="number"
                placeholder="Нова цена"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                disabled={isProcessing}
              />
              <Button
                onClick={handlePriceUpdate}
                disabled={isProcessing || !newPrice}
              >
                Актуализирай
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Затвори
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
