"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
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
} from "lucide-react";
import { EditProductDialog } from "@/components/inventory/EditProductDialog";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";

const InventoryHistory = dynamic(
  () => import("@/components/inventory/InventoryHistory"),
  {
    loading: () => (
      <div className="p-20 text-center text-zinc-400 font-medium uppercase tracking-widest text-[10px] animate-pulse">
        Зареждане на история...
      </div>
    ),
  }
);

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
  const { products, isLoading, error, deleteProduct } = useProducts();
  const { idToken } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsEditOpen(true);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <Loader2
          className="h-10 w-10 animate-spin text-primary opacity-20"
          strokeWidth={1}
        />
        <p className="text-zinc-400 font-medium uppercase tracking-widest text-[10px]">
          Зареждане на инвентар...
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
                  className="group overflow-hidden transition-all duration-500 flex flex-col border border-zinc-100 dark:border-zinc-900 shadow-none bg-white dark:bg-zinc-950 rounded-2xl"
                >
                  <div className="relative h-64 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-zinc-50 dark:border-zinc-800">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
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
                        <h3 className="text-xl font-light leading-tight group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-zinc-400 text-[10px] font-medium uppercase tracking-[0.2em] mb-6">
                        {product.category || "General"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-zinc-50 dark:border-zinc-900">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest leading-none mb-2">
                          Цена
                        </span>
                        <span className="text-2xl font-light text-zinc-900 dark:text-white tracking-tight">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="h-10 px-6 rounded-xl font-medium text-[10px] uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-none border-none"
                      >
                        Детайли
                      </Button>
                    </div>
                  </div>
                </BentoCard>
              );
            })
          ) : (
            <div className="col-span-full py-40 text-center bg-zinc-50/30 dark:bg-zinc-900/10 rounded-[2rem] border-2 border-dashed border-zinc-100 dark:border-zinc-900">
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

      <AlertDialogContent className="rounded-[2.5rem] border-none shadow-none bg-white dark:bg-zinc-950 p-10 max-w-md">
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
    </AlertDialog>
  );
};

import { AddProductDialog } from "@/components/inventory/AddProductDialog";

export default function InventoryClient() {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleProductAdded = () => {
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Склад и наличности"
        description="Проследяване на спортна екипировка, пера и консумативи. Управление на инвентара и автоматични известия за ниски наличности."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Склад" },
        ]}
      >
        <Button
          onClick={() => setIsAddOpen(true)}
          className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
        >
          <Plus className="mr-3 h-4 w-4" strokeWidth={1.5} /> Добави артикул
        </Button>
      </PageHeader>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit mb-12 border border-zinc-100 dark:border-zinc-800">
          <TabsTrigger
            value="stock"
            className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
          >
            <Package className="mr-3 h-4 w-4" strokeWidth={1.5} /> Наличност
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
          >
            <History className="mr-3 h-4 w-4" strokeWidth={1.5} /> История
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="stock"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          <ProductList />
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          <BentoCard className="p-0 overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-[2rem] shadow-none">
            <InventoryHistory />
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
