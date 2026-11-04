"use client";

import { ArrowLeft, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { UniversalMediaUpload } from "@/components/shared/media/UniversalMediaUpload";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProductAction,
  updateProductAction,
} from "@/lib/actions/products-server";
import { Product } from "@/types";

interface ProductFormViewProps {
  mode: "add" | "edit";
  initialProduct?: Product | null;
  activeBranch?: string;
}

export function ProductFormView({
  mode,
  initialProduct,
  activeBranch = "bkgalabovo",
}: ProductFormViewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formName, setFormName] = useState(initialProduct?.name || "");
  const [formCategory, setFormCategory] = useState(
    initialProduct?.category || "Аксесоари"
  );
  const [formPrice, setFormPrice] = useState(
    initialProduct?.price ? String(initialProduct.price) : "0"
  );
  const [formStock, setFormStock] = useState(
    initialProduct?.stock !== undefined ? String(initialProduct.stock) : "0"
  );
  const [formRestockThreshold, setFormRestockThreshold] = useState(
    initialProduct?.restockThreshold !== undefined
      ? String(initialProduct.restockThreshold)
      : "5"
  );
  const [formDescription, setFormDescription] = useState(
    initialProduct?.description || ""
  );
  const [formImageUrl, setFormImageUrl] = useState(
    initialProduct?.imageUrl || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formPrice);
    const stock = parseInt(formStock, 10);
    const threshold = parseInt(formRestockThreshold, 10) || 3;

    if (!formName.trim() || isNaN(price) || isNaN(stock)) {
      toast.error("Моля, попълнете коректно име, цена и наличност.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "edit" && initialProduct?.id) {
        const res = await updateProductAction(initialProduct.id, {
          name: formName.trim(),
          category: formCategory.trim(),
          price,
          stock,
          restockThreshold: threshold,
          description: formDescription.trim(),
          imageUrl: formImageUrl.trim() || undefined,
        });

        if (!res.success) {
          toast.error(res.error || "Грешка при обновяване на артикула.");
          return;
        }

        toast.success("Артикулът е обновен успешно!");
      } else {
        const res = await createProductAction({
          name: formName.trim(),
          category: formCategory.trim(),
          price,
          stock,
          restockThreshold: threshold,
          description: formDescription.trim(),
          imageUrl: formImageUrl.trim() || undefined,
          siteId: activeBranch,
        });

        if (!res.success) {
          toast.error(res.error || "Грешка при създаване на артикула.");
          return;
        }

        toast.success("Новият артикул е добавен към магазина!");
      }

      router.push("/catalogs/shop");
      router.refresh();
    } catch {
      toast.error("Възникна непредвидена грешка.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    mode === "add"
      ? "Нов артикул в магазина"
      : `Редактиране: ${initialProduct?.name || "Артикул"}`;
  const subtitle =
    mode === "add"
      ? "Добавяне на ракета, пера, кордаж, клубен екип или аксесоар."
      : "Промяна на цена, складова наличност, праг за презареждане или снимка.";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Header / Back Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-xl border-zinc-200 dark:border-zinc-800"
          >
            <Link href="/catalogs/shop">
              <ArrowLeft className="mr-1.5 size-4" />
              <span>Назад към магазина</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
              {title}
            </h1>
            <p className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <BentoCard className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Наименование</Label>
            <Input
              required
              placeholder="напр. Yonex Nanoflare 700, Пера Aeroclub TR, Грип..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Категория</Label>
              <Input
                required
                placeholder="Ракети, Пера, Екипировка, Грипове..."
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Цена (EUR / лв.)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Наличност (бр.)</Label>
              <Input
                type="number"
                step="1"
                required
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">
                Минимален праг за презареждане
              </Label>
              <Input
                type="number"
                step="1"
                placeholder="напр. 3"
                value={formRestockThreshold}
                onChange={(e) => setFormRestockThreshold(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Описание (по избор)</Label>
            <Textarea
              rows={3}
              placeholder="Кратко описание, спецификация, грамаж, размер или характеристики..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="mt-1 rounded-xl text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Снимка на артикула</Label>
            <div className="mt-1.5">
              <UniversalMediaUpload
                value={formImageUrl}
                onChange={(url) => setFormImageUrl(url)}
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/catalogs/shop")}
              className="rounded-xl text-xs"
            >
              Отказ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                  <span>Запазване...</span>
                </>
              ) : (
                <>
                  <Package size={14} className="mr-1.5" />
                  <span>
                    {mode === "add" ? "Създай артикул" : "Запази промените"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </BentoCard>
    </div>
  );
}
