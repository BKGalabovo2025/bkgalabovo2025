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
    <DialogContent className="sm:max-w-[850px] p-8 sm:p-10 rounded-4xl bg-white dark:bg-zinc-950 border-none shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl font-light text-zinc-950 dark:text-zinc-50 flex items-center gap-3">
          <Package className="h-6 w-6 text-zinc-650" strokeWidth={1.5} />
          Редактиране на: {product.name}
        </DialogTitle>
        <DialogDescription className="font-light text-zinc-400 mt-1">
          Промяна на информацията за артикула, добавяне на снимки и управление на складовите наличности.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* LEFT COLUMN: Product Details */}
        <ProductDetailsForm />

        {/* RIGHT COLUMN: Inventory Movements System with Tabs */}
        <div className="space-y-6 md:border-l md:border-zinc-100 md:dark:border-zinc-900 md:pl-10 flex flex-col h-full min-h-[450px]">
          <Tabs defaultValue="stock" value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className="bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl h-11 w-full border border-zinc-200/40 dark:border-zinc-800/40 mb-6 flex">
              <TabsTrigger
                value="stock"
                className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all py-2"
              >
                Наличност
              </TabsTrigger>
              <TabsTrigger
                value="movements"
                className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all py-2"
              >
                Движения
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all py-2"
              >
                Продажби
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stock" className="outline-none flex-1 space-y-6">
              <ProductStockTab />
            </TabsContent>

            <TabsContent value="movements" className="outline-none flex-1 max-h-[380px] overflow-y-auto custom-scrollbar space-y-4 pr-1">
              <ProductMovementsTab />
            </TabsContent>

            <TabsContent value="sales" className="outline-none flex-1 max-h-[380px] overflow-y-auto custom-scrollbar space-y-4 pr-1">
              <ProductSalesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DialogFooter className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-3">
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
