"use client";

import {
  Edit2,
  Loader2,
  Package,
  PackagePlus,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { UniversalMediaUpload } from "@/components/shared/media/UniversalMediaUpload";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/lib/actions/products-server";
import { formatPrice } from "@/lib/currency";
import { sanitizeImageUrl } from "@/lib/utils";
import { Product } from "@/types";

interface ProductsCatalogClientProps {
  initialProducts: Product[];
  activeBranch: string;
}

function ProductStockBadge({
  stock,
  threshold,
}: {
  stock: number;
  threshold: number | null;
}) {
  if (stock <= 0) {
    return (
      <Badge className="border-rose-500/20 bg-rose-500/10 text-[10px] font-bold text-rose-600 dark:text-rose-400">
        Изчерпан
      </Badge>
    );
  }
  if (stock <= (threshold || 3)) {
    return (
      <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">
        Ограничен ({stock} бр.)
      </Badge>
    );
  }
  return (
    <Badge className="border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
      В наличност ({stock} бр.)
    </Badge>
  );
}

export default function ProductsCatalogClient({
  initialProducts,
  activeBranch,
}: ProductsCatalogClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Аксесоари");
  const [formPrice, setFormPrice] = useState("0");
  const [formStock, setFormStock] = useState("0");
  const [formRestockThreshold, setFormRestockThreshold] = useState("5");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category &&
          p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory("Аксесоари");
    setFormPrice("10");
    setFormStock("10");
    setFormRestockThreshold("3");
    setFormDescription("");
    setFormImageUrl("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category || "Аксесоари");
    setFormPrice(String(product.price ?? 0));
    setFormStock(String(product.stock ?? 0));
    setFormRestockThreshold(
      product.restockThreshold !== undefined &&
        product.restockThreshold !== null
        ? String(product.restockThreshold)
        : ""
    );
    setFormDescription(product.description || "");
    setFormImageUrl(product.imageUrl || "");
    setIsDialogOpen(true);
  };

  const submitEdit = async () => {
    if (!editingProduct) return;
    const res = await updateProductAction(editingProduct.id, {
      name: formName,
      category: formCategory,
      price: parseFloat(formPrice) || 0,
      stock: parseInt(formStock, 10) || 0,
      restockThreshold: formRestockThreshold
        ? parseInt(formRestockThreshold, 10)
        : null,
      description: formDescription,
      imageUrl: formImageUrl || null,
    });
    if (!res.success) throw new Error(res.error);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: formName.trim(),
              category: formCategory.trim(),
              price: parseFloat(formPrice) || 0,
              stock: parseInt(formStock, 10) || 0,
              restockThreshold: formRestockThreshold
                ? parseInt(formRestockThreshold, 10)
                : null,
              description: formDescription.trim(),
              imageUrl: formImageUrl.trim() || null,
            }
          : p
      )
    );
    toast.success("Продуктът е обновен успешно.");
  };

  const submitCreate = async () => {
    const res = await createProductAction({
      name: formName,
      category: formCategory,
      price: parseFloat(formPrice) || 0,
      stock: parseInt(formStock, 10) || 0,
      restockThreshold: formRestockThreshold
        ? parseInt(formRestockThreshold, 10)
        : null,
      description: formDescription,
      imageUrl: formImageUrl || null,
      siteId: activeBranch || "bkgalabovo",
    });
    if (!res.success || !res.id) throw new Error(res.error);

    const newProd: Product = {
      id: res.id,
      name: formName.trim(),
      category: formCategory.trim(),
      price: parseFloat(formPrice) || 0,
      currency: "EUR",
      stock: parseInt(formStock, 10) || 0,
      restockThreshold: formRestockThreshold
        ? parseInt(formRestockThreshold, 10)
        : null,
      description: formDescription.trim(),
      imageUrl: formImageUrl.trim() || null,
      siteId: activeBranch || "bkgalabovo",
    };

    setProducts((prev) => [newProd, ...prev]);
    toast.success("Продуктът е добавен в каталога.");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Името на продукта е задължително.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await submitEdit();
      } else {
        await submitCreate();
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Възникна грешка.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(`Сигурни ли сте, че искате да премахнете продукт "${name}"?`)
    ) {
      return;
    }

    try {
      const res = await deleteProductAction(id);
      if (!res.success) throw new Error(res.error);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Продуктът беше изтрит.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Грешка при изтриване.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Магазин & Стоки за продажба
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Управление на клубни продукти, цени в евро, наличности на склад и
            лимити.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className="h-10 rounded-xl bg-zinc-950 px-5 text-xs font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <PackagePlus className="mr-2 size-4" /> Добави стока
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            id="productSearchInput"
            name="productSearch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Търси продукт по име или категория..."
            aria-label="Търсене на продукт"
            className="h-10 rounded-xl pl-9 text-xs"
          />
        </div>

        {categories.length > 2 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {cat === "all" ? "Всички" : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
          <Package className="mb-3 size-10 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Няма намерени продукти
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {searchTerm
              ? "Опитайте с друго търсене."
              : "Добавете първия артикул в магазина."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => {
            return (
              <BentoCard
                key={p.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-none transition-all duration-300 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <div>
                  {/* Top image / badge area */}
                  <div className="relative mb-4 flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900/60">
                    {sanitizeImageUrl(p.imageUrl) ? (
                      <div className="relative size-full">
                        <Image
                          src={sanitizeImageUrl(p.imageUrl)!}
                          alt={p.name}
                          fill
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <Package className="size-12 text-zinc-300 dark:text-zinc-700" />
                    )}

                    <div className="absolute top-2.5 right-2.5">
                      <ProductStockBadge
                        stock={p.stock || 0}
                        threshold={p.restockThreshold ?? 3}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mb-2">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-zinc-600 uppercase dark:bg-zinc-900 dark:text-zinc-400">
                      {p.category || "Общи"}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-sm font-bold text-zinc-900 group-hover:text-primary dark:text-white">
                    {p.name}
                  </h3>

                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Bottom price and actions */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-900">
                  <div>
                    <div className="text-[10px] font-medium text-zinc-400">
                      Цена
                    </div>
                    <div className="text-base font-extrabold text-zinc-900 dark:text-white">
                      {formatPrice(p.price || 0)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(p)}
                      className="size-8 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
                      title="Редактирай"
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(p.id, p.name)}
                      className="size-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      title="Изтрий"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </BentoCard>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingProduct
                ? "Редакция на артикул"
                : "Добавяне на нов артикул в магазина"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Попълнете параметрите на продукта, цена и наличност на склад.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="productFormName"
                className="text-xs font-semibold"
              >
                Име на артикула *
              </Label>
              <Input
                id="productFormName"
                name="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="напр. Грип Babolat"
                required
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="productFormCategory"
                  className="text-xs font-semibold"
                >
                  Категория
                </Label>
                <Input
                  id="productFormCategory"
                  name="category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Аксесоари, Пера, Ракети..."
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="productFormPrice"
                  className="text-xs font-semibold"
                >
                  Цена (EUR) *
                </Label>
                <Input
                  id="productFormPrice"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  required
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="productFormStock"
                  className="text-xs font-semibold"
                >
                  Наличност (бр.) *
                </Label>
                <Input
                  id="productFormStock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  required
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="productFormThreshold"
                  className="text-xs font-semibold"
                >
                  Праг за напомняне (бр.)
                </Label>
                <Input
                  id="productFormThreshold"
                  name="restockThreshold"
                  type="number"
                  min="0"
                  value={formRestockThreshold}
                  onChange={(e) => setFormRestockThreshold(e.target.value)}
                  placeholder="3"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <UniversalMediaUpload
              id="productFormImageUrl"
              label="Снимка на артикула (по избор)"
              description="PNG, JPG, WEBP или външен линк (до 800KB)"
              value={formImageUrl}
              onChange={(url) => setFormImageUrl(url)}
              storageFolder="products"
              placeholderUrl="https://... или външен линк"
            />

            <div className="space-y-1.5">
              <Label
                htmlFor="productFormDescription"
                className="text-xs font-semibold"
              >
                Описание (по избор)
              </Label>
              <Textarea
                id="productFormDescription"
                name="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Кратко представяне на артикула..."
                rows={3}
                className="rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                )}
                {editingProduct ? "Запази промените" : "Добави в магазина"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
