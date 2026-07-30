"use client";

import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  UnifiedSaleWizardProvider,
  useUnifiedSaleWizard,
} from "./UnifiedSaleWizardContext";
import { UnifiedWizardStep1 } from "./UnifiedWizardStep1";
import { UnifiedWizardStep2 } from "./UnifiedWizardStep2";
import { UnifiedWizardStep3 } from "./UnifiedWizardStep3";
import { UnifiedWizardStep4 } from "./UnifiedWizardStep4";

const UnifiedSaleWizardContent = () => {
  const {
    item,
    step,
    totalSteps,
    displayStep,
    handleNextStep,
    handlePrevStep,
    handleClose,
    handleExecuteSale,
    isProcessing,
    mode,
    isGuestSale,
  } = useUnifiedSaleWizard();

  const isCompleted = step >= 5; // Processing or Receipt
  const isReceipt = step === 6;

  return (
    <div className="relative">
      <DialogHeader className="border-b border-zinc-100 px-6 py-5 pb-4 dark:border-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <DialogTitle className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {item.name}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
              Продажба
            </DialogDescription>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex size-8 items-center justify-center rounded-full bg-zinc-100/80 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>
      </DialogHeader>

      <div className="p-6">
        <div className="w-full">
          {step === 1 && <UnifiedWizardStep1 />}
          {step === 2 &&
            (mode === "product" || mode === "general" || isGuestSale ? (
              <UnifiedWizardStep3 />
            ) : (
              <UnifiedWizardStep2 />
            ))}
          {step === 3 &&
            (mode === "product" || mode === "general" || isGuestSale ? (
              <UnifiedWizardStep4 />
            ) : (
              <UnifiedWizardStep3 />
            ))}
          {step >= 4 && <UnifiedWizardStep4 />}
        </div>
      </div>

      {!isCompleted && (
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-900 dark:bg-zinc-900/20">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i < displayStep
                    ? "w-6 bg-emerald-500"
                    : "w-2 bg-zinc-200 dark:bg-zinc-800"
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={isProcessing}
                className="h-11 rounded-xl px-5 text-xs font-semibold tracking-wider uppercase shadow-sm hover:bg-zinc-50"
              >
                <ArrowLeft className="mr-2 size-4" />
                Назад
              </Button>
            )}

            {displayStep < totalSteps ? (
              <Button
                onClick={handleNextStep}
                className="h-11 rounded-xl bg-emerald-500 px-6 text-xs font-semibold tracking-wider text-white uppercase shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30"
              >
                Напред
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleExecuteSale}
                disabled={isProcessing}
                className="h-11 rounded-xl bg-emerald-500 px-6 text-xs font-semibold tracking-wider text-white uppercase shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Завърши
              </Button>
            )}
          </div>
        </div>
      )}

      {isReceipt && (
        <div className="flex justify-center border-t border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-900 dark:bg-zinc-900/20">
          <Button
            onClick={handleClose}
            variant="outline"
            className="h-11 rounded-xl border-zinc-200 bg-white px-8 text-xs font-bold text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Затвори
          </Button>
        </div>
      )}
    </div>
  );
};

interface UnifiedSaleWizardDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  mode: "product" | "general" | "training" | "recovery";
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
}

export const UnifiedSaleWizardDialog = ({
  item,
  mode,
  isOpen,
  onClose,
  onSaleSuccess,
}: UnifiedSaleWizardDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden border-zinc-200/50 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/95">
        <UnifiedSaleWizardProvider
          item={item}
          mode={mode}
          isOpen={isOpen}
          onClose={onClose}
          onSaleSuccess={onSaleSuccess}
        >
          <UnifiedSaleWizardContent />
        </UnifiedSaleWizardProvider>
      </DialogContent>
    </Dialog>
  );
};
