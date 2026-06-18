"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Product } from "@/types";
import { ProductSaleWizardProvider, useProductSaleWizard } from "./product-sale-wizard/ProductSaleWizardContext";
import { ProductSaleStep1 } from "./product-sale-wizard/ProductSaleStep1";
import { ProductSaleStep2 } from "./product-sale-wizard/ProductSaleStep2";
import { ProductSaleStep3 } from "./product-sale-wizard/ProductSaleStep3";
import { ProductSaleStep4 } from "./product-sale-wizard/ProductSaleStep4";
import { ProductSaleStep5 } from "./product-sale-wizard/ProductSaleStep5";

interface ProductSaleWizardDialogProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
}

const ProductSaleWizardDialogContent = () => {
  const { product, step, selectedMember, isProcessing, handleClose, handlePrevStep, handleNextStep, handleExecuteSale } = useProductSaleWizard();

  return (
    <DialogContent className="sm:max-w-[600px] p-8 sm:p-10 rounded-4xl bg-white dark:bg-zinc-950 border-none shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl font-light text-zinc-955 dark:text-zinc-50 flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-emerald-500" strokeWidth={1.5} />
          Бърза Продажба: {product.name}
        </DialogTitle>
        <DialogDescription className="font-light text-zinc-400 mt-1">
          {step < 5 ? (
            <span>Стъпка {step} от 4: Попълнете детайлите за продажба на артикула.</span>
          ) : (
            <span>Продажбата е завършена успешно. Благодарим ви!</span>
          )}
        </DialogDescription>
      </DialogHeader>

      {/* STEP PROGRESS BAR */}
      {step < 5 && (
        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full mb-8 overflow-hidden">
          <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      )}

      {step === 1 && <ProductSaleStep1 />}
      {step === 2 && <ProductSaleStep2 />}
      {step === 3 && <ProductSaleStep3 />}
      {step === 4 && <ProductSaleStep4 />}
      {step === 5 && <ProductSaleStep5 />}

      {/* DIALOG FOOTER & NAVIGATION BUTTONS */}
      {step < 4 && (
        <DialogFooter className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex flex-row justify-between items-center sm:justify-between w-full">
          <div>
            {step > 1 ? (
              <Button variant="outline" onClick={handlePrevStep} disabled={isProcessing} className="rounded-xl px-5 h-11 flex items-center gap-2 text-zinc-500 hover:text-zinc-800">
                <ArrowLeft className="h-4 w-4" /> Назад
              </Button>
            ) : (
              <Button variant="outline" onClick={handleClose} disabled={isProcessing} className="rounded-xl px-5 h-11 text-zinc-500 hover:text-zinc-800">
                Отказ
              </Button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <Button onClick={handleNextStep} disabled={isProcessing} className="rounded-xl px-6 h-11 bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-2 font-medium text-[11px] uppercase tracking-widest">
                Напред <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button onClick={handleExecuteSale} disabled={isProcessing || !selectedMember} className="rounded-xl px-8 h-11 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 font-medium text-[11px] uppercase tracking-widest">
                Завърши продажбата <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      )}

      {step === 5 && (
        <DialogFooter className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-end">
          <Button onClick={handleClose} className="rounded-xl px-8 h-11 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-[11px] uppercase tracking-widest">
            Затвори
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
};

export const ProductSaleWizardDialog = (props: ProductSaleWizardDialogProps) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <ProductSaleWizardProvider {...props}>
        <ProductSaleWizardDialogContent />
      </ProductSaleWizardProvider>
    </Dialog>
  );
};
