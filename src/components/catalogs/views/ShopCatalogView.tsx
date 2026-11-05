"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Link2,
  MoreHorizontal,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function ProductStockBadge({
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

export interface ShopProductCardProps {
  product: Product;
  isSelected?: boolean;
  isCopied?: boolean;
  onSale: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
}

export function ShopProductCard({
  product,
  isSelected,
  isCopied,
  onSale,
  onDelete,
  onCopyLink,
}: ShopProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const images = useMemo(() => {
    if (!product.imageUrl) return [];
    return product.imageUrl
      .split(",")
      .map((url) => sanitizeImageUrl(url.trim()))
      .filter((url): url is string => Boolean(url));
  }, [product.imageUrl]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [images.length]);

  const hasLongDesc = (product.description?.length || 0) > 110;

  return (
    <BentoCard
      id={`item-${product.id}`}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-0 shadow-xs transition-all duration-300 hover:shadow-md dark:bg-zinc-950",
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/60 shadow-lg bg-blue-50/15 dark:border-blue-400 dark:ring-blue-400/60 dark:bg-blue-950/20"
          : "border-zinc-200/80 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
      )}
    >
      {/* Top Media or Sleek Compact Header */}
      {images.length > 0 ? (
        <div className="relative h-28 sm:h-32 w-full overflow-hidden border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          {images.map((imgUrl, idx) => (
            <Image
              key={imgUrl}
              src={imgUrl}
              alt={product.name}
              fill
              unoptimized
              className={cn(
                "object-cover transition-all duration-500 group-hover:scale-105",
                idx === activeImageIndex
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              )}
            />
          ))}
          {images.length > 1 && (
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "size-1 rounded-full transition-all",
                    idx === activeImageIndex ? "bg-white w-2" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <ProductStockBadge
              stock={product.stock}
              threshold={product.restockThreshold}
            />
          </div>
          {isSelected && (
            <div className="absolute top-2 left-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              Избран
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-3.5 py-2 dark:border-zinc-800/80 dark:bg-zinc-900/40">
          <div className="flex items-center gap-1.5">
            <Package className="size-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
              {product.category || "Артикул"}
            </span>
            {isSelected && (
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                Избран
              </span>
            )}
          </div>
          <ProductStockBadge
            stock={product.stock}
            threshold={product.restockThreshold}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div className="space-y-1.5">
          {images.length > 0 && (
            <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
              {product.category || "Общи"}
            </span>
          )}
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">
            {product.name}
          </h4>
          {product.description && (
            <div>
              <p
                className={cn(
                  "text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed",
                  !isExpanded && hasLongDesc && "line-clamp-2"
                )}
              >
                {product.description}
              </p>
              {hasLongDesc && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                >
                  <span>{isExpanded ? "Скрий" : "Виж още"}</span>
                  {isExpanded ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Price & Actions */}
        <div className="mt-3.5 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Цена
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={onSale}
              disabled={product.stock <= 0}
              className="h-8 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
              title={
                product.stock <= 0
                  ? "Изчерпана наличност"
                  : "Бърза продажба на клиент или състезател"
              }
            >
              <ShoppingCart size={13} className="mr-1" />
              <span>Продай</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCopyLink}
              className="h-8 px-2 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              title={`Копирай директен линк към ${product.name}`}
              aria-label={`Копирай директен линк към ${product.name}`}
            >
              {isCopied ? (
                <Check
                  size={13}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              ) : (
                <Link2 size={13} />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  title="Още действия"
                  aria-label="Още действия"
                >
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/catalogs/shop/${product.id}/edit`}
                    className="cursor-pointer"
                  >
                    <Edit2 className="mr-2 size-3.5" />
                    <span>Редакция</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onCopyLink}
                  className="cursor-pointer"
                >
                  <Link2 className="mr-2 size-3.5" />
                  <span>Копирай линк</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  <span>Изтрий</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </BentoCard>
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
          {filteredProducts.map((product) => (
            <ShopProductCard
              key={product.id}
              product={product}
              isSelected={itemParam === product.id}
              isCopied={copiedItemId === product.id}
              onSale={() => openSale(product)}
              onDelete={() => handleDelete(product)}
              onCopyLink={() => handleCopyLink(product)}
            />
          ))}
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
