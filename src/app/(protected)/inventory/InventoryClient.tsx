"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types";
import {
  PlusCircle,
  Edit,
  Trash2,
  ImageIcon,
  Loader2,
  Package,
  History,
  Search,
} from "lucide-react";
import { EditProductDialog } from "@/components/inventory/EditProductDialog";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryHistory from "@/components/inventory/InventoryHistory";
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
  const { products, isLoading, error, deleteProduct } = useProducts();
  const { user } = useAuth();
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
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const handleProductUpdate = () => {
    setIsEditOpen(false);
    setSelectedProduct(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          Зареждане на инвентар...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-rose-500 font-bold">
        Грешка при зареждане на продуктите.
      </div>
    );
  }

  return (
    <AlertDialog>
      <div className="space-y-6">
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Търсене на продукт..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-2xl border-none bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const isLowStock =
                product.stock <= (product.restockThreshold || 5);
              const isOutOfStock = product.stock <= 0;

              return (
                <BentoCard
                  key={product.id}
                  className="group overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col border-none shadow-md bg-white"
                >
                  <div className="relative h-56 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-200">
                        <ImageIcon className="h-16 w-16 mb-2 opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                          No Image
                        </span>
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {isOutOfStock ? (
                        <div className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg animate-pulse">
                          Изчерпан
                        </div>
                      ) : isLowStock ? (
                        <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg">
                          Ниска наличност
                        </div>
                      ) : null}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-white/95 backdrop-blur-sm shadow-xl hover:bg-white hover:scale-110 active:scale-95 transition-all"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4 text-slate-600" />
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 rounded-xl bg-white/95 backdrop-blur-sm shadow-xl hover:bg-rose-50 hover:text-rose-600 hover:scale-110 active:scale-95 transition-all"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </AlertDialogTrigger>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div
                        className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg backdrop-blur-md ${
                          isOutOfStock
                            ? "bg-rose-900/80 text-white"
                            : isLowStock
                              ? "bg-amber-500 text-white"
                              : "bg-white/90 text-slate-900"
                        }`}
                      >
                        {product.stock} бр.
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="text-xl font-black font-bento leading-tight group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-4">
                        {product.category || "General"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                          Цена
                        </span>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-primary transition-all"
                      >
                        Детайли
                      </Button>
                    </div>
                  </div>
                </BentoCard>
              );
            })
          ) : (
            <div className="col-span-full py-32 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
              <Package className="h-16 w-16 text-slate-100 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                Няма намерени продукти
              </p>
              <Button
                variant="link"
                onClick={() => setSearchTerm("")}
                className="mt-2 text-primary font-bold"
              >
                Изчисти търсенето
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black font-bento">
            Сигурни ли сте?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-medium text-slate-500">
            Това ще изтрие перманентно продукта &quot;{productToDelete?.name}
            &quot;. Това действие не може да бъде отменено.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => setProductToDelete(null)}
            className="rounded-xl font-bold"
          >
            Отказ
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            className="bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-bold shadow-lg shadow-rose-100"
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
          user={user}
          onProductUpdate={handleProductUpdate}
        />
      )}
    </AlertDialog>
  );
};

export default function InventoryClient() {
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleProductAdded = () => {
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Инвентар"
        description="Управление на продукти, складови наличности и история на доставките."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Инвентар" },
        ]}
      >
        <Button
          onClick={() => setIsAddOpen(true)}
          className="rounded-xl shadow-md font-bento"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Добави продукт
        </Button>
      </PageHeader>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl w-fit mb-8">
          <TabsTrigger
            value="stock"
            className="rounded-xl px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2.5"
          >
            <Package className="mr-2 h-4 w-4" /> Наличност
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2.5"
          >
            <History className="mr-2 h-4 w-4" /> История
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
          <BentoCard className="p-0 overflow-hidden border-none shadow-md">
            <InventoryHistory />
          </BentoCard>
        </TabsContent>
      </Tabs>

      <EditProductDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        product={null}
        user={user}
        onProductUpdate={handleProductAdded}
      />
    </div>
  );
}
