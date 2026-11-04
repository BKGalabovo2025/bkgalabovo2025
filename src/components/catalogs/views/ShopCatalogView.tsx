"use client";

import {
  Edit2,
  Loader2,
  Package,
  PackagePlus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { UniversalMediaUpload } from "@/components/shared/media/UniversalMediaUpload";
import { UnifiedSaleWizardDialog } from "@/components/shared/wizard-v2/UnifiedSaleWizardDialog";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
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
import {
  createProductAction,
  deleteProductAction,
  getProductsServerAction,
  updateProductAction,
} from "@/lib/actions/products-server";
import { formatPrice } from "@/lib/currency";
import { sanitizeImageUrl } from "@/lib/utils";
import { Product } from "@/types";

interface ShopCatalogViewProps {
  initialProducts: Product[];
  activeBranch?: string;
}

function ProductStockBadge({
  stock,
  threshold,
}: {
  stock: number;
  threshold?: number | null;
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

export function ShopCatalogView({
  initialProducts,
  activeBranch = "bkgalabovo",
}: ShopCatalogViewProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Sale wizard state
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);

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
    const price = parseFloat(formPrice);
    const stock = parseInt(formStock, 10);
    const threshold = formRestockThreshold
      ? parseInt(formRestockThreshold, 10)
      : null;

    if (!formName.trim() || isNaN(price) || isNaN(stock)) {
      toast.error("Моля, попълнете коректно име, цена и наличност.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateProductAction(editingProduct.id, {
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

      toast.success("Артикулът е обновен успешно.");
      setIsDialogOpen(false);
      const refreshRes = await getProductsServerAction(activeBranch);
      if (refreshRes.success && refreshRes.data) {
        setProducts(refreshRes.data);
      }
      router.refresh();
    } catch {
      toast.error("Възникна непредвидена грешка.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCreate = async () => {
    const price = parseFloat(formPrice);
    const stock = parseInt(formStock, 10);
    const threshold = formRestockThreshold
      ? parseInt(formRestockThreshold, 10)
      : null;

    if (!formName.trim() || isNaN(price) || isNaN(stock)) {
      toast.error("Моля, попълнете коректно име, цена и наличност.");
      return;
    }

    setIsSubmitting(true);
    try {
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

      toast.success("Новият артикул е добавен към магазина.");
      setIsDialogOpen(false);
      const refreshRes = await getProductsServerAction(activeBranch);
      if (refreshRes.success && refreshRes.data) {
        setProducts(refreshRes.data);
      }
      router.refresh();
    } catch {
      toast.error("Възникна непредвидена грешка.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Сигурни ли сте, че искате да изтриете "${product.name}"?`)) {
      return;
    }

    try {
      const res = await deleteProductAction(product.id);
      if (!res.success) {
        toast.error(res.error || "Грешка при изтриване на артикула.");
        return;
      }

      toast.success("Артикулът е изтрит.");
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      router.refresh();
    } catch {
      toast.error("Възникна непредвидена грешка при изтриването.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Category Filter Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
          />
          <Input
            placeholder="Търсене на ракета, пера, грип или аксесоар..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl pl-9 text-xs"
          />
        </div>

        <Button
          size="sm"
          onClick={openCreateDialog}
          className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 shrink-0"
        >
          <PackagePlus className="mr-1.5 size-4" />
          <span>Добави артикул</span>
        </Button>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 2 && (
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {cat === "all" ? "Всички артикули" : cat}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
          <Package size={40} className="mx-auto text-zinc-400" />
          <h4 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
            Няма намерени артикули
          </h4>
          <p className="mt-1 text-xs text-zinc-500">
            Опитайте с друго търсене или добавете нов артикул с бутона по-горе.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const hasImage = Boolean(product.imageUrl);
            const safeImg = sanitizeImageUrl(product.imageUrl);

            return (
              <BentoCard
                key={product.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative mb-3 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800/60">
                    {hasImage && safeImg ? (
                      <Image
                        src={safeImg}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Package size={36} className="text-zinc-400" />
                    )}
                    <div className="absolute top-2 right-2">
                      <ProductStockBadge
                        stock={product.stock}
                        threshold={product.restockThreshold}
                      />
                    </div>
                  </div>

                  {/* Header info */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
                      {product.category || "Общи"}
                    </span>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1">
                      {product.name}
                    </h4>
                    {product.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer price & actions */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 uppercase">
                      Цена
                    </span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => setSaleProduct(product)}
                      disabled={product.stock <= 0}
                      className="h-8 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
                      title="Продай на състезател или гост"
                    >
                      <ShoppingCart size={13} className="mr-1" />
                      <span>Продай</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(product)}
                      className="size-8 p-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      title="Редактирай артикул"
                    >
                      <Edit2 size={13} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(product)}
                      className="size-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                      title="Изтрий артикул"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </BentoCard>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogTitle className="text-lg font-bold">
            {editingProduct
              ? "Редактиране на артикул"
              : "Нов артикул в магазина"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Въведете детайли за продукта, категорията, продажната цена и
            наличността.
          </DialogDescription>

          <div className="mt-4 space-y-3.5">
            <div>
              <Label className="text-xs font-semibold">Наименование</Label>
              <Input
                placeholder="напр. Yonex Nanoflare 700"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Категория</Label>
                <Input
                  placeholder="Ракети, Пера, Грипове..."
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1 rounded-xl text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">
                  Цена (EUR / лв.)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="mt-1 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Наличност (бр.)</Label>
                <Input
                  type="number"
                  step="1"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="mt-1 rounded-xl text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Минимален праг</Label>
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
              <Label className="text-xs font-semibold">
                Описание (по избор)
              </Label>
              <Textarea
                rows={2}
                placeholder="Кратко описание, размер, цвят или характеристики..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">
                Снимка на артикула
              </Label>
              <div className="mt-1.5">
                <UniversalMediaUpload
                  value={formImageUrl}
                  onChange={(url) => setFormImageUrl(url)}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              Отказ
            </Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={editingProduct ? submitEdit : submitCreate}
              className="rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {isSubmitting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : editingProduct ? (
                "Запази промените"
              ) : (
                "Създай артикул"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Wizard */}
      {saleProduct && (
        <UnifiedSaleWizardDialog
          item={{
            id: saleProduct.id,
            name: saleProduct.name,
            price: saleProduct.price,
            category: saleProduct.category,
            stock: saleProduct.stock,
          }}
          mode="product"
          isOpen={!!saleProduct}
          onClose={() => setSaleProduct(null)}
          onSaleSuccess={async () => {
            setSaleProduct(null);
            const refreshRes = await getProductsServerAction(activeBranch);
            if (refreshRes.success && refreshRes.data) {
              setProducts(refreshRes.data);
            }
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
