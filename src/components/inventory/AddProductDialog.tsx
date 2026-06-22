 
 
 
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
import { createProductAction } from "@/lib/actions/inventory";
import { useAuth } from "@/context/auth-context";
import { Label } from "@/components/ui/label";

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export const AddProductDialog = ({
  isOpen,
  onClose,
  onProductAdded,
}: AddProductDialogProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [restockThreshold, setRestockThreshold] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { idToken } = useAuth();

  const handleAdd = async () => {
    if (!idToken) {
      toast.error("Грешка при оторизация");
      return;
    }

    if (!name || !category || !price || !stock) {
      toast.error("Грешка", {
        description: "Моля попълнете всички задължителни полета.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const productData = {
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        description,
        imageUrl,
        restockThreshold: restockThreshold
          ? parseInt(restockThreshold, 10)
          : null,
      };

      const result = await createProductAction(idToken, productData);

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductAdded();
        onClose();
        // Clear form
        setName("");
        setCategory("");
        setPrice("");
        setStock("");
        setImageUrl("");
        setRestockThreshold("");
        setDescription("");
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при добавяне", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-4xl p-8 bg-white dark:bg-zinc-950 border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-zinc-950 dark:text-zinc-50">
            Добавяне на продукт
          </DialogTitle>
          <DialogDescription className="font-light text-zinc-400 mt-1">
            Въведете детайлите за новия продукт в каталога.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 mt-2">
          <div className="grid gap-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Име на артикула *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Тениска BKG"
              className="rounded-xl h-11"
              disabled={isProcessing}
            />
          </div>

          <div className="grid gap-1.5">
            <Label
              htmlFor="category"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Категория *
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="напр. Екипировка, Пера"
              className="rounded-xl h-11"
              disabled={isProcessing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label
                htmlFor="price"
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Цена (EUR) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="rounded-xl h-11"
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-1.5">
              <Label
                htmlFor="stock"
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Наличност *
              </Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="rounded-xl h-11"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label
                htmlFor="imageUrl"
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Изображение URL
              </Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Линк към снимка..."
                className="rounded-xl h-11"
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-1.5">
              <Label
                htmlFor="threshold"
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Минимален праг (бр.)
              </Label>
              <Input
                id="threshold"
                type="number"
                value={restockThreshold}
                onChange={(e) => setRestockThreshold(e.target.value)}
                placeholder="напр. 5"
                className="rounded-xl h-11"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label
              htmlFor="description"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Описание
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Допълнителни детайли..."
              className="rounded-xl h-11"
              disabled={isProcessing}
            />
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl px-6 h-11"
          >
            Отказ
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isProcessing}
            className="rounded-xl px-6 h-11 bg-zinc-950 text-white hover:bg-zinc-800"
          >
            Добави продукт
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
