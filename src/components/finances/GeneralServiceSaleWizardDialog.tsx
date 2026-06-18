"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GeneralService } from "@/types";
import { ShoppingBag, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { GeneralWizardProvider, useGeneralWizard } from "./general-service-wizard/GeneralWizardContext";
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
      return <span>Стъпка {step} от 3: Попълнете детайлите за продажба на услугата.</span>;
    }
    if (step === 4) {
      return <span>Регистриране на продажбата...</span>;
    }
    return <span>Продажбата е завършена успешно. Благодарим ви!</span>;
  };

  return (
    <DialogContent className="sm:max-w-[600px] p-8 sm:p-10 rounded-5xl bg-white dark:bg-zinc-950 border-none shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl font-light text-zinc-950 dark:text-zinc-50 flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-emerald-500" strokeWidth={1.5} />
          Продажба: {service.name}
        </DialogTitle>
        <DialogDescription className="font-light text-zinc-500 mt-1">
          {renderStepDescription()}
        </DialogDescription>
      </DialogHeader>

      {/* STEP PROGRESS BAR */}
      {step < 4 && (
        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full mb-8 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
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
            {step === 3 ? (
              <Button
                onClick={handleExecuteSale}
                disabled={isProcessing}
                className="rounded-xl px-8 h-11 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 font-medium text-[11px] uppercase tracking-widest"
              >
                Завърши продажбата <Check className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                disabled={isProcessing}
                className="rounded-xl px-6 h-11 bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-2 font-medium text-[11px] uppercase tracking-widest"
              >
                Напред <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </DialogFooter>
      )}

      {step >= 5 && (
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
  );
};

export const GeneralServiceSaleWizardDialog = (props: GeneralServiceSaleWizardDialogProps) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <GeneralWizardProvider {...props}>
        <GeneralServiceSaleWizardContent />
      </GeneralWizardProvider>
    </Dialog>
  );
};
