"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types";
import { PlusCircle, Edit, Trash2, ImageIcon, Loader2, Boxes } from "lucide-react";
import { EditProductDialog } from "@/components/inventory/EditProductDialog";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryHistory from "@/components/inventory/InventoryHistory";
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
      <div className="flex flex-col items-center justify-center py-48 bg-white/50 dark:bg-zinc-900/50 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-zinc-500 font-black font-heading text-xl">Синхронизиране...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-20 text-center bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] border border-red-100 dark:border-red-900/20">
        <p className="text-red-600 dark:text-red-400 font-black text-lg font-heading">Грешка при зареждане на инвентара</p>
      </div>
    );
  }

  return (
    <AlertDialog>
      <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all">
        <div className="hidden md:grid grid-cols-12 gap-4 items-center px-10 py-6 bg-zinc-50/80 dark:bg-zinc-800/80 border-b border-zinc-100 dark:border-zinc-800">
          <div className="col-span-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">Снимка</div>
          <div className="col-span-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Наименование</div>
          <div className="col-span-2 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Цена</div>
          <div className="col-span-2 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Наличност</div>
          <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">Действия</div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center px-10 py-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all group"
              >
                <div className="col-span-1 flex items-center justify-center md:justify-start">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-inner group-hover:scale-105 transition-transform">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="text-zinc-300 h-8 w-8" />
                    )}
                  </div>
                </div>
                <div className="col-span-5 text-center md:text-left">
                  <div className="font-black text-zinc-900 dark:text-zinc-100 font-heading text-lg group-hover:translate-x-1 transition-transform">
                    {product.name}
                  </div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-tighter mt-1">артикул №{product.id.slice(-6)}</div>
                </div>
                <div className="col-span-2 text-center md:text-right font-black text-zinc-900 dark:text-white text-xl font-heading">
                  {formatPrice(product.price)}
                </div>
                <div className="col-span-2 text-center md:text-right">
                  <Badge className={cn(
                    "rounded-xl font-black px-4 py-1 text-[10px] uppercase tracking-widest border-none shadow-sm",
                    product.stock <= 5 
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}>
                    {product.stock} бр.
                  </Badge>
                </div>
                <div className="col-span-2 flex justify-center items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(product)}
                    className="h-10 w-10 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 hover:border-blue-600 transition-all shadow-sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setProductToDelete(product)}
                      className="h-10 w-10 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 hover:border-red-600 transition-all shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-40 opacity-40">
              <ImageIcon className="h-24 w-24 mx-auto mb-6" />
              <p className="text-2xl font-black font-heading">Инвентарът е празен</p>
            </div>
          )}
        </div>
      </div>

      <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="p-10 text-center">
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Trash2 className="h-10 w-10 text-red-600" />
          </div>
          <AlertDialogTitle className="font-heading font-black text-3xl mb-4">Сигурни ли сте?</AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-zinc-500 font-medium px-4">
            Продуктът <span className="text-zinc-900 dark:text-white font-black">&quot;{productToDelete?.name}&quot;</span> ще бъде премахнат завинаги от системата.
          </AlertDialogDescription>
        </div>
        <div className="grid grid-cols-2 border-t border-zinc-100 dark:border-zinc-800">
          <AlertDialogCancel onClick={() => setProductToDelete(null)} className="h-16 rounded-none border-none text-zinc-500 font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors m-0">
            Отказ
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            className="h-16 rounded-none border-none bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700 transition-colors m-0"
          >
            Изтрий
          </AlertDialogAction>
        </div>
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

const InventoryPage = () => {
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleProductAdded = () => {
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tight font-heading text-zinc-900 dark:text-white flex items-center gap-4">
            <Boxes className="h-12 w-12 text-blue-600" />
            Инвентар
          </h1>
          <p className="text-zinc-500 text-lg font-medium">Следете наличностите и историята на движението на стоки.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="h-12 px-10 rounded-[1.25rem] bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-black text-xs uppercase tracking-[0.15em] hover:scale-[1.02] transition-all shadow-xl shadow-zinc-900/20">
          <PlusCircle className="mr-2 h-5 w-5" /> Добави продукт
        </Button>
      </div>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="bg-zinc-100 dark:bg-zinc-800 rounded-3xl p-1.5 h-14 border border-zinc-200 dark:border-zinc-700 shadow-inner flex max-w-fit mb-10">
          <TabsTrigger value="stock" className="rounded-2xl px-12 h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-lg font-black font-heading transition-all">Наличност</TabsTrigger>
          <TabsTrigger value="history" className="rounded-2xl px-12 h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-lg font-black font-heading transition-all">История</TabsTrigger>
        </TabsList>
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <TabsContent value="stock" className="mt-0 ring-offset-0 focus-visible:ring-0">
            <ProductList />
          </TabsContent>
          <TabsContent value="history" className="mt-0 ring-offset-0 focus-visible:ring-0">
            <InventoryHistory />
          </TabsContent>
        </div>
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
};

export default InventoryPage;
