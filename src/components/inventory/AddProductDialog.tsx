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
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black font-bento">
            Добавяне на продукт
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Въведете детайлите за новия продукт в каталога.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="font-bold">
              Име *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Тениска BKG"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category" className="font-bold">
              Категория *
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="напр. Екипировка"
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price" className="font-bold">
                Цена (EUR) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock" className="font-bold">
                Наличност *
              </Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="font-bold">
              Описание
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="..."
              className="rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl font-bold"
          >
            Отказ
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isProcessing}
            className="rounded-xl font-bold"
          >
            Добави продукт
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
