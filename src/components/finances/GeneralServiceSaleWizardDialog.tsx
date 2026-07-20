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
import { GeneralService } from "@/types";
import { ShoppingBag, ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  GeneralWizardProvider,
  useGeneralWizard,
} from "./general-service-wizard/GeneralWizardContext";
import { GeneralWizardStep1 } from "./general-service-wizard/GeneralWizardStep1";
import { GeneralWizardStep2 } from "./general-service-wizard/GeneralWizardStep2";
import { GeneralWizardStep3 } from "./general-service-wizard/GeneralWizardStep3";

interface GeneralServiceSaleWizardDialogProps {
  service: GeneralService;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
}

const GeneralServiceSaleWizardContent = () => {
  const {
    step,
    handleClose,
    handlePrevStep,
    handleNextStep,
    handleExecuteSale,
    isProcessing,
    service,
  } = useGeneralWizard();

  const renderStepDescription = () => {
    if (step < 4) {
      return (
        <span>
          Стъпка {step} от 3: Попълнете детайлите за продажба на услугата.
        </span>
      );
    }
    if (step === 4) {
      return <span>Регистриране на продажбата...</span>;
    }
    return <span>Продажбата е завършена успешно. Благодарим ви!</span>;
  };

  return (
    <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto rounded-5xl border-none bg-white p-8 shadow-2xl sm:max-w-150 sm:p-10 dark:bg-zinc-950">
      <DialogHeader className="mb-6">
        <DialogTitle className="flex items-center gap-3 text-2xl font-light text-zinc-950 dark:text-zinc-50">
          <ShoppingBag className="size-6 text-emerald-500" strokeWidth={1.5} />
          Продажба: {service.name}
        </DialogTitle>
        <DialogDescription className="mt-1 font-light text-zinc-500">
          {renderStepDescription()}
        </DialogDescription>
      </DialogHeader>

      {/* STEP PROGRESS BAR */}
      {step < 4 && (
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            // eslint-disable-next-line react/forbid-dom-props
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      )}

      {/* RENDER CURRENT STEP */}
      {step === 1 && <GeneralWizardStep1 />}
      {step === 2 && <GeneralWizardStep2 />}
      {step >= 3 && <GeneralWizardStep3 />}

      {/* DIALOG FOOTER: NAVIGATION BUTTONS */}
      {step < 4 && (
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
            {step === 3 ? (
              <Button
                onClick={handleExecuteSale}
                disabled={isProcessing}
                className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-8 text-[11px] font-medium tracking-widest text-white uppercase hover:bg-emerald-600"
              >
                Завърши продажбата <Check className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                disabled={isProcessing}
                className="flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-6 text-[11px] font-medium tracking-widest text-white uppercase hover:bg-zinc-800"
              >
                Напред <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </DialogFooter>
      )}

      {step >= 5 && (
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
  );
};

export const GeneralServiceSaleWizardDialog = (
  props: GeneralServiceSaleWizardDialogProps
) => {
  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => !open && props.onClose()}
    >
      <GeneralWizardProvider {...props}>
        <GeneralServiceSaleWizardContent />
      </GeneralWizardProvider>
    </Dialog>
  );
};
