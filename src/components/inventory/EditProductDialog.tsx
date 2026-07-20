"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditProductProvider, useEditProduct } from "./edit-product-dialog/EditProductContext";
import { ProductDetailsForm } from "./edit-product-dialog/ProductDetailsForm";
import { ProductStockTab } from "./edit-product-dialog/ProductStockTab";
import { ProductMovementsTab } from "./edit-product-dialog/ProductMovementsTab";
import { ProductSalesTab } from "./edit-product-dialog/ProductSalesTab";

interface EditProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdate: () => void;
}

const EditProductDialogContent = () => {
  const { product, isProcessing, activeTab, setActiveTab, onClose } = useEditProduct();

  if (!product) return null;

  return (
    <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto rounded-4xl border-none bg-white p-8 shadow-xl sm:max-w-[850px] sm:p-10 dark:bg-zinc-950">
      <DialogHeader className="mb-6">
        <DialogTitle className="flex items-center gap-3 text-2xl font-light text-zinc-950 dark:text-zinc-50">
          <Package className="text-zinc-650 size-6" strokeWidth={1.5} />
          Редактиране на: {product.name}
        </DialogTitle>
        <DialogDescription className="mt-1 font-light text-zinc-400">
          Промяна на информацията за артикула, добавяне на снимки и управление на складовите наличности.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* LEFT COLUMN: Product Details */}
        <ProductDetailsForm />

        {/* RIGHT COLUMN: Inventory Movements System with Tabs */}
        <div className="flex h-full min-h-[450px] flex-col space-y-6 md:border-l md:border-zinc-100 md:pl-10 md:dark:border-zinc-900">
          <Tabs defaultValue="stock" value={activeTab} onValueChange={setActiveTab} className="flex w-full flex-1 flex-col">
            <TabsList className="mb-6 flex h-11 w-full rounded-2xl border border-zinc-200/40 bg-zinc-100 p-1 dark:border-zinc-800/40 dark:bg-zinc-900/50">
              <TabsTrigger
                value="stock"
                className="flex-1 rounded-xl py-2 text-xs font-semibold shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
              >
                Наличност
              </TabsTrigger>
              <TabsTrigger
                value="movements"
                className="flex-1 rounded-xl py-2 text-xs font-semibold shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
              >
                Движения
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="flex-1 rounded-xl py-2 text-xs font-semibold shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
              >
                Продажби
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stock" className="flex-1 space-y-6 outline-none">
              <ProductStockTab />
            </TabsContent>

            <TabsContent value="movements" className="custom-scrollbar max-h-95 flex-1 space-y-4 overflow-y-auto pr-1 outline-none">
              <ProductMovementsTab />
            </TabsContent>

            <TabsContent value="sales" className="custom-scrollbar max-h-95 flex-1 space-y-4 overflow-y-auto pr-1 outline-none">
              <ProductSalesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DialogFooter className="mt-8 flex justify-end gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-900">
        <Button variant="outline" onClick={onClose} disabled={isProcessing} className="rounded-xl px-6">
          Затвори
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const EditProductDialog = (props: EditProductDialogProps) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <EditProductProvider {...props}>
        <EditProductDialogContent />
      </EditProductProvider>
    </Dialog>
  );
};
