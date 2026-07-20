"use client";

import { ClubService as Service } from "@/types";
import {
  RecoveryWizardProvider,
  useRecoveryWizard,
} from "./recovery-wizard/RecoveryWizardContext";
import { RecoveryWizardStep1 } from "./recovery-wizard/RecoveryWizardStep1";
import { RecoveryWizardStep2 } from "./recovery-wizard/RecoveryWizardStep2";
import { RecoveryWizardStep3 } from "./recovery-wizard/RecoveryWizardStep3";
import { RecoveryWizardStep4 } from "./recovery-wizard/RecoveryWizardStep4";
import { SaleWizardDialogShared } from "@/components/shared/wizard/SaleWizardDialogShared";

interface RecoverySaleWizardDialogProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
}

const RecoverySaleWizardContent = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const wizardState = useRecoveryWizard();
  const { step, isGuestSale } = wizardState;

  return (
    <SaleWizardDialogShared
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wizardState={wizardState as any}
      isOpen={isOpen}
      onClose={onClose}
    >
      {step === 1 && <RecoveryWizardStep1 />}
      {step === 2 && !isGuestSale && <RecoveryWizardStep2 />}
      {((step === 2 && isGuestSale) || (step === 3 && !isGuestSale)) && (
        <RecoveryWizardStep3 />
      )}
      {((step >= 3 && isGuestSale) || (step >= 4 && !isGuestSale)) && (
        <RecoveryWizardStep4 />
      )}
    </SaleWizardDialogShared>
  );
};

export const RecoverySaleWizardDialog = (
  props: RecoverySaleWizardDialogProps
) => {
  return (
    <RecoveryWizardProvider {...props}>
      <RecoverySaleWizardContent isOpen={props.isOpen} onClose={props.onClose} />
    </RecoveryWizardProvider>
  );
};
