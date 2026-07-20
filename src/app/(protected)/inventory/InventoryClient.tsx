"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useProductsWithCache } from "@/hooks/useProductsWithCache";
import { Product } from "@/types";
import {
  Edit,
  Trash2,
  ImageIcon,
  Loader2,
  Package,
  History,
  Search,
  Plus,
  LayoutGrid,
  ShoppingBag,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import { useInventoryEvents } from "@/hooks/useInventoryEvents";
import dynamic from "next/dynamic";

const EditProductDialog = dynamic(() => import("@/components/inventory/EditProductDialog").then(m => m.EditProductDialog), { ssr: false });
const ProductSaleWizardDialog = dynamic(() => import("@/components/inventory/ProductSaleWizardDialog").then(m => m.ProductSaleWizardDialog), { ssr: false });
const InventoryHistory = dynamic(() => import("@/components/inventory/InventoryHistory"), { ssr: false });
const InventorySalesHistory = dynamic(() => import("@/components/inventory/InventorySalesHistory"), { ssr: false });
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Input } from "@/components/ui/input";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProductList = () => {
  const { products, isLoading, error, deleteProduct } = useProductsWithCache();
  const { idToken } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const [isSaleOpen, setIsSaleOpen] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditOpen(true);
  };

  const handleSale = (product: Product) => {
    setSaleProduct(product);
    setIsSaleOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete && idToken) {
      await deleteProduct(productToDelete.id, idToken);
      setProductToDelete(null);
    }
  };

  const handleProductUpdate = () => {
    setIsEditOpen(false);
    setSelectedProduct(null);
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-24">
        <Loader2
          className="size-10 animate-spin text-primary opacity-20"
          strokeWidth={1}
        />
        <p className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
          Зареждане на продукти...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 text-center text-xl font-light text-rose-500">
        Грешка при зареждане на продуктите.
      </div>
    );
  }

  return (
    <AlertDialog>
      <div className="space-y-10">
        <div className="group relative max-w-md">
          <Search
            className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary"
            strokeWidth={1.5}
          />
          <Input
            placeholder="Търсене на продукт..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 rounded-2xl border border-zinc-100 bg-white pl-11 text-sm font-light shadow-none transition-all focus-visible:ring-1 focus-visible:ring-primary/30 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const isLowStock =
                product.stock <= (product.restockThreshold || 5);
              const isOutOfStock = product.stock <= 0;

              const getStatusBadge = () => {
                if (isOutOfStock) {
                  return (
                    <div className="rounded-full bg-rose-500 px-4 py-1.5 text-[10px] font-medium tracking-widest text-white uppercase shadow-none">
                      Изчерпан
                    </div>
                  );
                }
                if (isLowStock) {
                  return (
                    <div className="rounded-full bg-amber-500 px-4 py-1.5 text-[10px] font-medium tracking-widest text-white uppercase shadow-none">
                      Ниска наличност
                    </div>
                  );
                }
                return null;
              };

              const getStockClasses = () => {
                if (isOutOfStock) return "bg-rose-500/10 border-rose-500/20 text-rose-500";
                if (isLowStock) return "bg-amber-500/10 border-amber-500/20 text-amber-500";
                return "bg-white/80 dark:bg-zinc-900/80 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white";
              };

              return (
                <BentoCard
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-none transition-all duration-500 hover:shadow-xl hover:shadow-zinc-100/20 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:shadow-none"
                >
                  <div className="relative flex h-64 items-center justify-center overflow-hidden border-b border-zinc-50 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority={true}
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center bg-zinc-50 text-zinc-200 dark:bg-zinc-900 dark:text-zinc-800">
                        <ImageIcon
                          className="mb-2 size-16 opacity-20"
                          strokeWidth={1}
                        />
                        <span className="text-[10px] font-medium tracking-[0.3em] uppercase opacity-40">
                          No Image
                        </span>
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      {getStatusBadge()}
                    </div>

                    <div className="absolute top-6 right-6 flex translate-y-2 gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-10 rounded-xl border border-zinc-100 bg-white/90 shadow-none backdrop-blur-md transition-all hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:bg-zinc-800"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit
                          className="size-4 text-zinc-600 dark:text-zinc-400"
                          strokeWidth={1.5}
                        />
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-10 rounded-xl border border-zinc-100 bg-white/90 shadow-none backdrop-blur-md transition-all hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:bg-rose-900/20"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2
                            className="size-4 text-rose-500"
                            strokeWidth={1.5}
                          />
                        </Button>
                      </AlertDialogTrigger>
                    </div>

                    <div className="absolute bottom-6 left-6">
                      <div
                        className={`rounded-xl border px-4 py-2 text-[11px] font-medium tracking-widest uppercase backdrop-blur-md ${getStockClasses()}`}
                      >
                        {product.stock} бр.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-8">
                    <div>
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <h3 className="line-clamp-2 flex min-h-14 items-center text-lg leading-snug font-medium text-zinc-900 transition-colors group-hover:text-primary dark:text-zinc-50">
                          {product.name}
                        </h3>
                      </div>
                      <p className="mb-6 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                        {product.category || "General"}
                      </p>
                    </div>

                    <div className="space-y-5 border-t border-zinc-100 pt-6 dark:border-zinc-900">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] leading-none font-medium tracking-widest text-zinc-400 uppercase">
                          Цена
                        </span>
                        <span className="text-2xl leading-none font-light tracking-tight text-zinc-900 dark:text-white">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <div className="grid w-full grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSale(product)}
                          className="h-11 w-full rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-700 uppercase shadow-none transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        >
                          Продажба
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="h-11 w-full rounded-xl border-none bg-zinc-950 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
                        >
                          Детайли
                        </Button>
                      </div>
                    </div>
                  </div>
                </BentoCard>
              );
            })
          ) : (
            <div className="col-span-full rounded-4xl border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-40 text-center dark:border-zinc-900 dark:bg-zinc-900/10">
              <Package
                className="mx-auto mb-8 size-16 text-zinc-200 dark:text-zinc-800"
                strokeWidth={1}
              />
              <p className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                Няма намерени продукти
              </p>
              <Button
                variant="link"
                onClick={() => setSearchTerm("")}
                className="mt-4 text-[11px] font-medium tracking-widest text-primary uppercase"
              >
                Изчисти търсенето
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialogContent className="max-w-md rounded-5xl border-none bg-white p-10 shadow-none dark:bg-zinc-950">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl leading-tight font-light text-zinc-900 dark:text-white">
            Сигурни ли сте?
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-4 text-sm leading-relaxed font-light text-zinc-400">
            Това ще изтрие перманентно продукта &quot;{productToDelete?.name}
            &quot;. Това действие не може да бъде отменено.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-10 gap-3">
          <AlertDialogCancel
            onClick={() => setProductToDelete(null)}
            className="h-12 rounded-xl border-zinc-100 bg-white px-6 text-[11px] font-medium tracking-widest uppercase dark:border-zinc-800 dark:bg-zinc-900"
          >
            Отказ
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            className="h-12 rounded-xl bg-rose-500 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none hover:bg-rose-600"
          >
            Изтрий
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

      {(isEditOpen || selectedProduct) && (
        <EditProductDialog
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onProductUpdate={handleProductUpdate}
        />
      )}

      {isSaleOpen && saleProduct && (
        <ProductSaleWizardDialog
          isOpen={isSaleOpen}
          onClose={() => {
            setIsSaleOpen(false);
            setSaleProduct(null);
          }}
          product={saleProduct}
          onSaleSuccess={() => {
            setIsSaleOpen(false);
            setSaleProduct(null);
            handleProductUpdate();
          }}
        />
      )}
    </AlertDialog>
  );
};

import { AddProductDialog } from "@/components/inventory/AddProductDialog";

/** Pulsing banner that summarises low/out-of-stock items. */
function LowStockBanner() {
  const { products } = useProductsWithCache();
  const outOfStock = products.filter((p) => p.stock <= 0);
  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= (p.restockThreshold || 5)
  );

  const getNamesString = (list: typeof products) => {
    const names = list.map((p) => p.name).slice(0, 3).join(", ");
    return list.length > 3 ? `${names} (+${list.length - 3})` : names;
  };

  if (outOfStock.length === 0 && lowStock.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-rose-100 bg-rose-50/60 px-6 py-4 dark:border-rose-900/40 dark:bg-rose-950/20">
      <div className="flex shrink-0 items-center gap-2">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
        </span>
        <span className="text-[10px] font-black tracking-[0.2em] text-rose-600 uppercase dark:text-rose-400">
          Внимание — Наличности
        </span>
      </div>
      {outOfStock.length > 0 && (
        <div className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase">
          <PackageX className="size-3" />
          {outOfStock.length} изчерпан
          {outOfStock.length === 1 ? " артикул" : " артикула"}
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase">
          <AlertTriangle className="size-3" />
          {lowStock.length} с ниска наличност
        </div>
      )}
      <p className="ml-auto hidden text-[10px] font-medium text-zinc-500 sm:block dark:text-zinc-400">
        {outOfStock.length > 0 ? getNamesString(outOfStock) : getNamesString(lowStock)}
      </p>
    </div>
  );
}

interface InventoryClientProps {
  showPageHeader?: boolean;
}

export default function InventoryClient({
  showPageHeader = true,
}: InventoryClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");
  useInventoryEvents();

  const handleProductAdded = () => {
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      {showPageHeader && (
        <PageHeader
          title="Каталог Магазин"
          description="Проследяване на спортна екипировка, пера и консумативи. Управление на инвентара и автоматични известия за ниски наличности."
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Каталози", href: "/catalogs" },
            { label: "Каталог Магазин" },
          ]}
        >
          <Button
            onClick={() => setIsAddOpen(true)}
            className="h-12 rounded-xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
          >
            <Plus className="mr-3 size-4" strokeWidth={1.5} /> Добави артикул
          </Button>
        </PageHeader>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 px-2">
          <TabsList className="mb-0 w-fit rounded-2xl border border-zinc-100 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <TabsTrigger
              value="inventory"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
            >
              <LayoutGrid className="mr-3 size-4" strokeWidth={1.5} />{" "}
              Наличност
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
            >
              <History className="mr-3 size-4" strokeWidth={1.5} /> Движения
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
            >
              <ShoppingBag className="mr-3 size-4" strokeWidth={1.5} />{" "}
              Продажби
            </TabsTrigger>
          </TabsList>

          {!showPageHeader && (
            <Button
              onClick={() => setIsAddOpen(true)}
              className="h-10 rounded-xl bg-zinc-950 px-6 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
            >
              <Plus className="mr-2 size-3.5" strokeWidth={1.5} /> Добави
              артикул
            </Button>
          )}
        </div>

        <TabsContent
          value="inventory"
          className="mt-0 ring-0 outline-none focus-visible:outline-none"
        >
          <LowStockBanner />
          <ProductList />
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-0 ring-0 outline-none focus-visible:outline-none"
        >
          <BentoCard className="overflow-hidden rounded-4xl border border-zinc-100 bg-white p-0 shadow-none dark:border-zinc-900 dark:bg-zinc-950">
            <InventoryHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent
          value="sales"
          className="mt-0 ring-0 outline-none focus-visible:outline-none"
        >
          <BentoCard className="overflow-hidden rounded-4xl border border-zinc-100 bg-white p-0 shadow-none dark:border-zinc-900 dark:bg-zinc-950">
            <InventorySalesHistory />
          </BentoCard>
        </TabsContent>
      </Tabs>

      <AddProductDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
}
