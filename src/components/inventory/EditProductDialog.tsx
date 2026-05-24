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
import { Product } from "@/types";
import {
  restockProductAction,
  adjustProductStockAction,
  updateProductAction,
} from "@/lib/actions/inventory";
import { useAuth } from "@/context/auth-context";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Package, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

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
  // Product info states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [restockThreshold, setRestockThreshold] = useState("");
  const [description, setDescription] = useState("");

  // Stock operations states
  const [restockAmount, setRestockAmount] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { idToken } = useAuth();

  // Populate states when product changes
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategory(product.category || "");
      setPrice(product.price?.toString() || "0");
      setImageUrl(product.imageUrl || "");
      setRestockThreshold(product.restockThreshold?.toString() || "");
      setDescription(product.description || "");
    }
  }, [product]);

  const handleUpdateInfo = async () => {
    if (!product || !idToken) return;
    if (!name.trim() || !category.trim() || !price) {
      toast.error("Грешка", {
        description: "Моля, попълнете всички задължителни полета.",
      });
      return;
    }

    const priceVal = parseFloat(price);
    if (isNaN(priceVal) || priceVal < 0) {
      toast.error("Грешка", {
        description: "Моля, въведете валидна, неотрицателна цена.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const productData = {
        name,
        category,
        price: priceVal,
        description,
        imageUrl,
        restockThreshold: restockThreshold
          ? parseInt(restockThreshold, 10)
          : null,
      };

      const result = await updateProductAction(
        product.id,
        idToken,
        productData
      );

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при актуализация", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

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

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] p-8 sm:p-10 rounded-4xl bg-white dark:bg-zinc-950 border-none shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-light text-zinc-950 dark:text-zinc-50 flex items-center gap-3">
            <Package className="h-6 w-6 text-zinc-650" strokeWidth={1.5} />
            Редактиране на: {product.name}
          </DialogTitle>
          <DialogDescription className="font-light text-zinc-400 mt-1">
            Промяна на информацията за артикула, добавяне на снимки и управление
            на складовите наличности.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* LEFT COLUMN: Product Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Информация за продукта
              </h3>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-name"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Име на артикула *
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="напр. Грип Pro's Pro"
                  className="rounded-xl h-11"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="edit-category"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Категория *
                </Label>
                <Input
                  id="edit-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="напр. Грипове, Пера, Екипировка"
                  className="rounded-xl h-11"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="edit-price"
                    className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    Цена (EUR) *
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl h-11"
                    disabled={isProcessing}
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="edit-threshold"
                    className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    Минимален праг (бр.)
                  </Label>
                  <Input
                    id="edit-threshold"
                    type="number"
                    value={restockThreshold}
                    onChange={(e) => setRestockThreshold(e.target.value)}
                    placeholder="напр. 5"
                    className="rounded-xl h-11"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="edit-image"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Изображение URL (Снимка)
                </Label>
                <Input
                  id="edit-image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Линк към снимка на артикула..."
                  className="rounded-xl h-11"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="edit-description"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Описание
                </Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Допълнителни спецификации, размери или бележки..."
                  className="rounded-xl"
                  rows={3}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateInfo}
              disabled={isProcessing}
              className="w-full rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 h-12 font-medium text-[11px] uppercase tracking-widest transition-all mt-4"
            >
              Запази информацията
            </Button>
          </div>

          {/* RIGHT COLUMN: Inventory Movements */}
          <div className="space-y-6 md:border-l md:border-zinc-100 md:dark:border-zinc-900 md:pl-10">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-500 animate-spin-slow" />
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  Склад & Движения
                </h3>
              </div>
              <span className="text-xs font-medium text-zinc-500">
                Текуща наличност:{" "}
                <strong className="text-zinc-950 dark:text-white font-bold">
                  {product.stock} бр.
                </strong>
              </span>
            </div>

            <div className="space-y-6">
              {/* RESTOCK */}
              <div className="space-y-2">
                <Label
                  htmlFor="restock-amount"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Презареждане (Добавяне на стока)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="restock-amount"
                    type="number"
                    placeholder="Количество (напр. 10)"
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(e.target.value)}
                    disabled={isProcessing}
                    className="rounded-xl h-11"
                  />
                  <Button
                    onClick={handleRestock}
                    disabled={isProcessing || !restockAmount}
                    className="rounded-xl h-11 px-5 bg-zinc-950 text-white hover:bg-zinc-800"
                  >
                    Заприходи
                  </Button>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-900"></div>

              {/* ADJUSTMENT */}
              <div className="space-y-3">
                <div className="flex flex-col gap-0.5">
                  <Label
                    htmlFor="adjustment-amount"
                    className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 text-zinc-400" />
                    Корекция / Ръчно Отписване
                  </Label>
                  <p className="text-[10px] text-zinc-400 font-light">
                    Използвайте отрицателно число за бракуване/отписване (напр.
                    -5).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    id="adjustment-amount"
                    type="number"
                    placeholder="Количество"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    disabled={isProcessing}
                    className="rounded-xl h-11"
                  />
                  <Button
                    onClick={handleAdjustment}
                    disabled={isProcessing || !adjustmentAmount}
                    className="rounded-xl h-11 px-5 bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    Коригирай
                  </Button>
                </div>

                <div className="grid gap-1.5">
                  <Label
                    htmlFor="adjustment-notes"
                    className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider"
                  >
                    Причина / Бележка
                  </Label>
                  <Textarea
                    id="adjustment-notes"
                    placeholder="Причина (задължително при отписване/бракуване)..."
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                    disabled={isProcessing}
                    className="rounded-xl"
                    rows={2}
                  />
                </div>
              </div>
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
            Затвори
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
