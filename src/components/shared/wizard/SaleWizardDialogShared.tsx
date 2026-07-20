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

import { ClubService } from "@/types";

/** Generic shape of the wizard context used by the UI */
export interface SaleWizardState {
  step: number;
  totalSteps: number;
  displayStep: number;
  isGuestSale: boolean;
  isProcessing: boolean;
  service: { name: string; [key: string]: unknown } | null;
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
      <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto rounded-5xl border-none bg-white p-8 shadow-2xl sm:max-w-155 sm:p-10 dark:bg-zinc-950">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-zinc-955 flex items-center gap-3 text-2xl font-light dark:text-zinc-50">
            <ShoppingBag
              className="size-6 text-emerald-500"
              strokeWidth={1.5}
            />
            Продажба: {service?.name}
          </DialogTitle>
          <DialogDescription className="mt-1 font-light text-zinc-500">
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
          <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ width: `${(displayStep / totalSteps) * 100}%` }}
            />
          </div>
        )}

        {/* RENDER CURRENT STEP (Passed as children) */}
        {children}

        {/* DIALOG FOOTER: NAVIGATION BUTTONS */}
        {step < 5 && (
          <DialogFooter className="-mx-8 mt-6 -mb-10 flex w-[calc(100%+4rem)] flex-row items-center justify-between rounded-b-5xl border-t border-zinc-100 bg-white px-8 py-6 sm:justify-between dark:border-zinc-900 dark:bg-zinc-950">
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
              {(() => {
                const isLastStep = step >= (isGuestSale ? 3 : 4);
                if (isLastStep) {
                  return (
                    <Button
                      onClick={handleExecuteSale}
                      disabled={isProcessing}
                      className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-8 text-[11px] font-medium tracking-widest text-white uppercase hover:bg-emerald-600"
                    >
                      Завърши продажбата <Check className="size-4" />
                    </Button>
                  );
                }
                return (
                  <Button
                    onClick={handleNextStep}
                    disabled={isProcessing}
                    className="flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-6 text-[11px] font-medium tracking-widest text-white uppercase hover:bg-zinc-800"
                  >
                    Напред <ArrowRight className="size-3.5" />
                  </Button>
                );
              })()}
            </div>
          </DialogFooter>
        )}

        {step >= 6 && (
          <DialogFooter className="-mx-8 mt-6 -mb-10 flex w-[calc(100%+4rem)] justify-end rounded-b-5xl border-t border-zinc-100 bg-white px-8 py-6 dark:border-zinc-900 dark:bg-zinc-950">
            <Button
              onClick={handleClose}
              className="h-11 rounded-xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase hover:bg-zinc-800"
            >
              Затвори
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
