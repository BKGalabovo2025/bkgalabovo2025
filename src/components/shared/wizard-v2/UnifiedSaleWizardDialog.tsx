"use client";

import { ArrowLeft, ArrowRight, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
    <div className="relative flex flex-col flex-1 h-full overflow-hidden">
      <div className="shrink-0 border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 pr-10 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-0.5">
            <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {item.name}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
              Продажба
            </DialogDescription>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex size-7.5 items-center justify-center rounded-full bg-zinc-100/80 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5 min-h-0">
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
        <div className="shrink-0 flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-900 dark:bg-zinc-900/20">
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
                className="h-9 rounded-xl px-3.5 text-xs font-semibold tracking-wider uppercase shadow-sm hover:bg-zinc-50"
              >
                <ArrowLeft className="mr-1.5 size-3.5" />
                Назад
              </Button>
            )}

            {displayStep < totalSteps ? (
              <Button
                onClick={handleNextStep}
                className="h-9 rounded-xl bg-emerald-500 px-4 text-xs font-semibold tracking-wider text-white uppercase shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30"
              >
                Напред
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            ) : (
              <Button
                onClick={handleExecuteSale}
                disabled={isProcessing}
                className="h-9 rounded-xl bg-emerald-500 px-4 text-xs font-semibold tracking-wider text-white uppercase shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30"
              >
                {isProcessing ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : null}
                Завърши
              </Button>
            )}
          </div>
        </div>
      )}

      {isReceipt && (
        <div className="shrink-0 flex justify-center border-t border-zinc-100 bg-zinc-50/50 py-2.5 sm:px-6 dark:border-zinc-900 dark:bg-zinc-900/20">
          <Button
            onClick={handleClose}
            variant="outline"
            className="h-9 rounded-xl border-zinc-200 bg-white px-6 text-xs font-bold text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
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
      <DialogContent className="flex max-h-[90dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-xl md:max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:hidden">
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
