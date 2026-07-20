"use client";

import { Service } from "@/app/(protected)/finances/services/service.types";
import {
  TrainingWizardProvider,
  useTrainingWizard,
} from "./training-wizard/TrainingWizardContext";
import { TrainingWizardStep1 } from "./training-wizard/TrainingWizardStep1";
import { TrainingWizardStep2 } from "./training-wizard/TrainingWizardStep2";
import { TrainingWizardStep3 } from "./training-wizard/TrainingWizardStep3";
import { TrainingWizardStep4 } from "./training-wizard/TrainingWizardStep4";
import { SaleWizardDialogShared } from "@/components/shared/wizard/SaleWizardDialogShared";

interface TrainingSaleWizardDialogProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
}

const TrainingSaleWizardContent = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const wizardState = useTrainingWizard();
  const { step, isGuestSale } = wizardState;

  return (
    <SaleWizardDialogShared
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wizardState={wizardState as any}
      isOpen={isOpen}
      onClose={onClose}
    >
      {step === 1 && <TrainingWizardStep1 />}
      {step === 2 && !isGuestSale && <TrainingWizardStep2 />}
      {((step === 2 && isGuestSale) || (step === 3 && !isGuestSale)) && (
        <TrainingWizardStep3 />
      )}
      {((step >= 3 && isGuestSale) || (step >= 4 && !isGuestSale)) && (
        <TrainingWizardStep4 />
      )}
    </SaleWizardDialogShared>
  );
};

export const TrainingSaleWizardDialog = (
  props: TrainingSaleWizardDialogProps
) => {
  return (
    <TrainingWizardProvider {...props}>
      <TrainingSaleWizardContent isOpen={props.isOpen} onClose={props.onClose} />
    </TrainingWizardProvider>
  );
};
