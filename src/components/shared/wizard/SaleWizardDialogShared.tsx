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

/** Generic shape of the wizard context used by the UI */
export interface SaleWizardState {
  step: number;
  totalSteps: number;
  displayStep: number;
  isGuestSale: boolean;
  isProcessing: boolean;
  service: any;
  handleClose: () => void;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  handleExecuteSale: () => void;
}

interface SaleWizardDialogSharedProps {
  wizardState: SaleWizardState;
  isOpen: boolean;
  onClose: () => void;
  /** Pass the steps to be rendered based on the current step */
  children: React.ReactNode;
}

export const SaleWizardDialogShared = ({
  wizardState,
  isOpen,
  onClose,
  children,
}: SaleWizardDialogSharedProps) => {
  const {
    step,
    totalSteps,
    displayStep,
    isGuestSale,
    handleClose,
    handlePrevStep,
    handleNextStep,
    handleExecuteSale,
    isProcessing,
    service,
  } = wizardState;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] p-8 sm:p-10 rounded-5xl bg-white dark:bg-zinc-950 border-none shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-light text-zinc-955 dark:text-zinc-50 flex items-center gap-3">
            <ShoppingBag
              className="h-6 w-6 text-emerald-500"
              strokeWidth={1.5}
            />
            Продажба: {service?.name}
          </DialogTitle>
          <DialogDescription className="font-light text-zinc-500 mt-1">
            {(() => {
              if (step === 5)
                return <span>Регистриране на продажбата...</span>;
              if (step > 5)
                return (
                  <span>Продажбата е завършена успешно. Благодарим ви!</span>
                );
              const stepName = isGuestSale
                ? ["Избор на клиент", "Детайли на плащане", "Потвърждение"][
                    step - 1
                  ]
                : [
                    "Избор на клиент",
                    "Присъствия и период",
                    "Начин на плащане",
                    "Потвърждение",
                  ][step - 1];
              return (
                <span>
                  Стъпка {displayStep} от {totalSteps}: {stepName}
                </span>
              );
            })()}
          </DialogDescription>
        </DialogHeader>

        {/* STEP PROGRESS BAR */}
        {step <= totalSteps && (
          <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full mb-8 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ width: `${(displayStep / totalSteps) * 100}%` }}
            />
          </div>
        )}

        {/* RENDER CURRENT STEP (Passed as children) */}
        {children}

        {/* DIALOG FOOTER: NAVIGATION BUTTONS */}
        {step < 5 && (
          <DialogFooter className="px-8 py-6 border-t border-zinc-100 dark:border-zinc-900 flex flex-row justify-between items-center sm:justify-between mt-6 -mx-8 -mb-10 w-[calc(100%+4rem)] bg-white dark:bg-zinc-950 rounded-b-5xl">
            <div>
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isProcessing}
                  className="rounded-xl px-5 h-11 flex items-center gap-2 text-zinc-500 hover:text-zinc-800"
                >
                  <ArrowLeft className="h-4 w-4" /> Назад
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="rounded-xl px-5 h-11 text-zinc-500 hover:text-zinc-800"
                >
                  Отказ
                </Button>
              )}
            </div>

            <div>
              {(() => {
                const isLastStep = step >= (isGuestSale ? 3 : 4);
                if (isLastStep) {
                  return (
                    <Button
                      onClick={handleExecuteSale}
                      disabled={isProcessing}
                      className="rounded-xl px-8 h-11 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 font-medium text-[11px] uppercase tracking-widest"
                    >
                      Завърши продажбата <Check className="h-4 w-4" />
                    </Button>
                  );
                }
                return (
                  <Button
                    onClick={handleNextStep}
                    disabled={isProcessing}
                    className="rounded-xl px-6 h-11 bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-2 font-medium text-[11px] uppercase tracking-widest"
                  >
                    Напред <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                );
              })()}
            </div>
          </DialogFooter>
        )}

        {step >= 6 && (
          <DialogFooter className="px-8 py-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-end mt-6 -mx-8 -mb-10 w-[calc(100%+4rem)] bg-white dark:bg-zinc-950 rounded-b-5xl">
            <Button
              onClick={handleClose}
              className="rounded-xl px-8 h-11 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-[11px] uppercase tracking-widest"
            >
              Затвори
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
