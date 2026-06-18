"use client";

import { useEditProduct } from "./EditProductContext";
import { Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const ProductDetailsForm = () => {
  const {
    name, setName,
    category, setCategory,
    price, setPrice,
    imageUrl, setImageUrl,
    restockThreshold, setRestockThreshold,
    description, setDescription,
    isProcessing,
    handleUpdateInfo,
  } = useEditProduct();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
        <Sparkles className="h-4 w-4 text-primary" strokeWidth={2} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Информация за продукта</h3>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="edit-name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
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
          <Label htmlFor="edit-category" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
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
            <Label htmlFor="edit-price" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
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
            <Label htmlFor="edit-threshold" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
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
          <Label htmlFor="edit-image" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
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
          <Label htmlFor="edit-description" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
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
  );
};
