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
import { EditProductDialog } from "@/components/inventory/EditProductDialog";
import { ProductSaleWizardDialog } from "@/components/inventory/ProductSaleWizardDialog";
import InventoryHistory from "@/components/inventory/InventoryHistory";
import InventorySalesHistory from "@/components/inventory/InventorySalesHistory";
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
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <Loader2
          className="h-10 w-10 animate-spin text-primary opacity-20"
          strokeWidth={1}
        />
        <p className="text-zinc-400 font-medium uppercase tracking-widest text-[10px]">
          Зареждане на продукти...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 text-center text-rose-500 font-light text-xl">
        Грешка при зареждане на продуктите.
      </div>
    );
  }

  return (
    <AlertDialog>
      <div className="space-y-10">
        <div className="relative group max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors"
            strokeWidth={1.5}
          />
          <Input
            placeholder="Търсене на продукт..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all font-light text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const isLowStock =
                product.stock <= (product.restockThreshold || 5);
              const isOutOfStock = product.stock <= 0;

              return (
                <BentoCard
                  key={product.id}
                  className="group overflow-hidden transition-all duration-500 flex flex-col border border-zinc-100 dark:border-zinc-900 shadow-none bg-white dark:bg-zinc-950 rounded-4xl hover:shadow-xl hover:shadow-zinc-100/20 dark:hover:shadow-none"
                >
                  <div className="relative h-64 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-zinc-50 dark:border-zinc-800">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="100vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-zinc-200 dark:text-zinc-800">
                        <ImageIcon
                          className="h-16 w-16 mb-2 opacity-20"
                          strokeWidth={1}
                        />
                        <span className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-40">
                          No Image
                        </span>
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      {isOutOfStock ? (
                        <div className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-widest shadow-none">
                          Изчерпан
                        </div>
                      ) : isLowStock ? (
                        <div className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-widest shadow-none">
                          Ниска наличност
                        </div>
                      ) : null}
                    </div>

                    <div className="absolute top-6 right-6 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-none border border-zinc-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-all"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit
                          className="h-4 w-4 text-zinc-600 dark:text-zinc-400"
                          strokeWidth={1.5}
                        />
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-none border border-zinc-100 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-all"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2
                            className="h-4 w-4 text-rose-500"
                            strokeWidth={1.5}
                          />
                        </Button>
                      </AlertDialogTrigger>
                    </div>

                    <div className="absolute bottom-6 left-6">
                      <div
                        className={`px-4 py-2 rounded-xl text-[11px] font-medium uppercase tracking-widest backdrop-blur-md border ${
                          isOutOfStock
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                            : isLowStock
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                              : "bg-white/80 dark:bg-zinc-900/80 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white"
                        }`}
                      >
                        {product.stock} бр.
                      </div>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="text-lg font-medium leading-snug text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors line-clamp-2 min-h-14 flex items-center">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-zinc-400 text-[10px] font-medium uppercase tracking-[0.2em] mb-6">
                        {product.category || "General"}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 space-y-5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest leading-none">
                          Цена
                        </span>
                        <span className="text-2xl font-light text-zinc-900 dark:text-white tracking-tight leading-none">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSale(product)}
                          className="w-full h-11 rounded-xl font-medium text-[10px] uppercase tracking-widest border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all shadow-none"
                        >
                          Продажба
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="w-full h-11 rounded-xl font-medium text-[10px] uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-none border-none"
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
            <div className="col-span-full py-40 text-center bg-zinc-50/30 dark:bg-zinc-900/10 rounded-4xl border-2 border-dashed border-zinc-100 dark:border-zinc-900">
              <Package
                className="h-16 w-16 text-zinc-200 dark:text-zinc-800 mx-auto mb-8"
                strokeWidth={1}
              />
              <p className="text-zinc-400 font-medium uppercase tracking-widest text-[11px]">
                Няма намерени продукти
              </p>
              <Button
                variant="link"
                onClick={() => setSearchTerm("")}
                className="mt-4 text-primary font-medium text-[11px] uppercase tracking-widest"
              >
                Изчисти търсенето
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialogContent className="rounded-5xl border-none shadow-none bg-white dark:bg-zinc-950 p-10 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-light text-zinc-900 dark:text-white leading-tight">
            Сигурни ли сте?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-light text-zinc-400 text-sm mt-4 leading-relaxed">
            Това ще изтрие перманентно продукта &quot;{productToDelete?.name}
            &quot;. Това действие не може да бъде отменено.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-10 gap-3">
          <AlertDialogCancel
            onClick={() => setProductToDelete(null)}
            className="rounded-xl font-medium text-[11px] uppercase tracking-widest h-12 px-6 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          >
            Отказ
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            className="bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-medium text-[11px] uppercase tracking-widest h-12 px-8 shadow-none"
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

  if (outOfStock.length === 0 && lowStock.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-4 rounded-3xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 mb-6">
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
          Внимание — Наличности
        </span>
      </div>
      {outOfStock.length > 0 && (
        <div className="flex items-center gap-1.5 bg-rose-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider">
          <PackageX className="h-3 w-3" />
          {outOfStock.length} изчерпан
          {outOfStock.length === 1 ? " артикул" : " артикула"}
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider">
          <AlertTriangle className="h-3 w-3" />
          {lowStock.length} с ниска наличност
        </div>
      )}
      <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-medium ml-auto hidden sm:block">
        {outOfStock.length > 0
          ? outOfStock
              .map((p) => p.name)
              .slice(0, 3)
              .join(", ") +
            (outOfStock.length > 3 ? ` (+${outOfStock.length - 3})` : "")
          : lowStock
              .map((p) => p.name)
              .slice(0, 3)
              .join(", ") +
            (lowStock.length > 3 ? ` (+${lowStock.length - 3})` : "")}
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
    <div className="space-y-8 animate-in fade-in duration-500">
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
            className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
          >
            <Plus className="mr-3 h-4 w-4" strokeWidth={1.5} /> Добави артикул
          </Button>
        </PageHeader>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-12 flex-wrap gap-4 px-2">
          <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit border border-zinc-100 dark:border-zinc-800 mb-0">
            <TabsTrigger
              value="inventory"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
            >
              <LayoutGrid className="mr-3 h-4 w-4" strokeWidth={1.5} />{" "}
              Наличност
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
            >
              <History className="mr-3 h-4 w-4" strokeWidth={1.5} /> Движения
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
            >
              <ShoppingBag className="mr-3 h-4 w-4" strokeWidth={1.5} />{" "}
              Продажби
            </TabsTrigger>
          </TabsList>

          {!showPageHeader && (
            <Button
              onClick={() => setIsAddOpen(true)}
              className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-10 px-6 font-medium text-[10px] uppercase tracking-widest transition-all"
            >
              <Plus className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} /> Добави
              артикул
            </Button>
          )}
        </div>

        <TabsContent
          value="inventory"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          <LowStockBanner />
          <ProductList />
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          <BentoCard className="p-0 overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-4xl shadow-none">
            <InventoryHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent
          value="sales"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          <BentoCard className="p-0 overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-4xl shadow-none">
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
