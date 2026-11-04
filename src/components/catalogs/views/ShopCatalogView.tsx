"use client";

import {
  Check,
  Edit2,
  Link2,
  Package,
  PackagePlus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { UnifiedSaleWizardDialog } from "@/components/shared/wizard-v2/UnifiedSaleWizardDialog";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteProductAction,
  getProductsServerAction,
} from "@/lib/actions/products-server";
import { formatPrice } from "@/lib/currency";
import { cn, sanitizeImageUrl } from "@/lib/utils";
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
  activeBranch = "bkgalabovo2025",
}: ShopCatalogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const saleId = searchParams.get("sale");
  const qParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "all";
  const itemParam = searchParams.get("item");

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState(qParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Sale wizard state
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);

  // Sync state with URL params
  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Auto-scroll when itemParam is provided
  useEffect(() => {
    if (itemParam) {
      const el = document.getElementById(`item-${itemParam}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [itemParam, products]);

  // Synchronize sale wizard with URL query parameter
  useEffect(() => {
    if (saleId) {
      const found = products.find((p) => p.id === saleId);
      if (found) {
        setSaleProduct(found);
      }
    } else {
      setSaleProduct(null);
    }
  }, [saleId, products]);

  const updateUrlParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    updateUrlParams((params) => {
      if (val.trim()) params.set("q", val);
      else params.delete("q");
    });
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    updateUrlParams((params) => {
      if (cat !== "all") params.set("category", cat);
      else params.delete("category");
    });
  };

  const handleCopyLink = (product: Product) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/catalogs/shop?item=${product.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopiedItemId(product.id);
          toast.success(`Директният линк за "${product.name}" е копиран!`);
          setTimeout(() => setCopiedItemId(null), 2500);
        })
        .catch(() => {
          toast.error("Неуспешно копиране на линк.");
        });
    } else {
      setCopiedItemId(product.id);
      toast.success(`Линк: ${url}`);
      setTimeout(() => setCopiedItemId(null), 2500);
    }
  };

  const openSale = (product: Product) => {
    setSaleProduct(product);
    updateUrlParams((params) => {
      params.set("sale", product.id);
    });
  };

  const closeSale = () => {
    setSaleProduct(null);
    updateUrlParams((params) => {
      params.delete("sale");
    });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="rounded-xl pl-9 text-xs"
          />
        </div>

        <Button
          size="sm"
          asChild
          className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 shrink-0"
        >
          <Link href="/catalogs/shop/new">
            <PackagePlus className="mr-1.5 size-4" />
            <span>Нов артикул</span>
          </Link>
        </Button>
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
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
            const isSelected = itemParam === product.id;
            const isCopied = copiedItemId === product.id;

            return (
              <BentoCard
                id={`item-${product.id}`}
                key={product.id}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-4 shadow-xs transition-all duration-300 dark:bg-zinc-900",
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/80 shadow-lg dark:border-blue-400 dark:ring-blue-400/80 bg-blue-50/15 dark:bg-blue-950/20"
                    : "border-zinc-200/80 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800"
                )}
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
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1">
                        {product.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(product)}
                        className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all cursor-pointer shrink-0 shadow-2xs"
                        title={`Копирай директен линк към ${product.name}`}
                        aria-label={`Копирай директен линк към ${product.name}`}
                      >
                        {isCopied ? (
                          <>
                            <Check
                              size={10}
                              className="text-emerald-600 dark:text-emerald-400"
                            />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Копирано!
                            </span>
                          </>
                        ) : (
                          <>
                            <Link2 size={10} />
                            <span>Линк</span>
                          </>
                        )}
                      </button>
                    </div>
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
                      onClick={() => openSale(product)}
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
                      asChild
                      className="size-8 p-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      title="Редактирай артикул"
                      aria-label={`Редактирай ${product.name}`}
                    >
                      <Link href={`/catalogs/shop/${product.id}/edit`}>
                        <Edit2 size={13} />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(product)}
                      className="size-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20"
                      title="Изтрий артикул"
                      aria-label={`Изтрий ${product.name}`}
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

      {/* Instant Sale Wizard */}
      {saleProduct && (
        <UnifiedSaleWizardDialog
          item={saleProduct}
          mode="product"
          isOpen={!!saleProduct}
          onClose={closeSale}
          onSaleSuccess={() => {
            closeSale();
            (async () => {
              const res = await getProductsServerAction(activeBranch);
              if (res.success && res.data) {
                setProducts(res.data);
              }
            })();
          }}
        />
      )}
    </div>
  );
}
