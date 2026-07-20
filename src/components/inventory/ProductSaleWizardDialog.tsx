"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Product } from "@/types";
import {
  ProductSaleWizardProvider,
  useProductSaleWizard,
} from "./product-sale-wizard/ProductSaleWizardContext";
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
  const {
    product,
    step,
    selectedMember,
    isProcessing,
    handleClose,
    handlePrevStep,
    handleNextStep,
    handleExecuteSale,
  } = useProductSaleWizard();

  return (
    <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto rounded-4xl border-none bg-white p-8 shadow-xl sm:max-w-150 sm:p-10 dark:bg-zinc-950">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-zinc-955 flex items-center gap-3 text-2xl font-light dark:text-zinc-50">
          <ShoppingBag className="size-6 text-emerald-500" strokeWidth={1.5} />
          Бърза Продажба: {product.name}
        </DialogTitle>
        <DialogDescription className="mt-1 font-light text-zinc-400">
          {step < 5 ? (
            <span>
              Стъпка {step} от 4: Попълнете детайлите за продажба на артикула.
            </span>
          ) : (
            <span>Продажбата е завършена успешно. Благодарим ви!</span>
          )}
        </DialogDescription>
      </DialogHeader>

      {/* STEP PROGRESS BAR */}
      {step < 5 && (
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
          <div
            className="h-full bg-emerald-500 transition-all duration-300" // eslint-disable-next-line react/forbid-dom-props
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      )}

      {step === 1 && <ProductSaleStep1 />}
      {step === 2 && <ProductSaleStep2 />}
      {step === 3 && <ProductSaleStep3 />}
      {step === 4 && <ProductSaleStep4 />}
      {step === 5 && <ProductSaleStep5 />}

      {/* DIALOG FOOTER & NAVIGATION BUTTONS */}
      {step < 4 && (
        <DialogFooter className="mt-8 flex w-full flex-row items-center justify-between border-t border-zinc-100 pt-6 sm:justify-between dark:border-zinc-900">
          <div>
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={isProcessing}
                className="flex h-11 items-center gap-2 rounded-xl px-5 text-zinc-500 hover:text-zinc-800"
              >
                <ArrowLeft className="size-4" /> Назад
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="h-11 rounded-xl px-5 text-zinc-500 hover:text-zinc-800"
              >
                Отказ
              </Button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <Button
                onClick={handleNextStep}
                disabled={isProcessing}
                className="flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-6 text-[11px] font-medium tracking-widest text-white uppercase hover:bg-zinc-800"
              >
                Напред <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                onClick={handleExecuteSale}
                disabled={isProcessing || !selectedMember}
                className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-8 text-[11px] font-medium tracking-widest text-white uppercase hover:bg-emerald-600"
              >
                Завърши продажбата <Check className="size-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      )}

      {step === 5 && (
        <DialogFooter className="mt-8 flex justify-end border-t border-zinc-100 pt-6 dark:border-zinc-900">
          <Button
            onClick={handleClose}
            className="h-11 rounded-xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase hover:bg-zinc-800"
          >
            Затвори
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
};

export const ProductSaleWizardDialog = (
  props: ProductSaleWizardDialogProps
) => {
  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => !open && props.onClose()}
    >
      <ProductSaleWizardProvider {...props}>
        <ProductSaleWizardDialogContent />
      </ProductSaleWizardProvider>
    </Dialog>
  );
};
