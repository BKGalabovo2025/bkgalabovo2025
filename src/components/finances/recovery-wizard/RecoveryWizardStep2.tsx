"use client";

import { useRecoveryWizard } from "./RecoveryWizardContext";
import { WizardStep2Wrapper } from "@/components/shared/wizard/WizardStep2Shared";

export const RecoveryWizardStep2 = () => {
  const wizardState = useRecoveryWizard();

  if (!wizardState.selectedMember) return null;

  return (
    <WizardStep2Wrapper
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(wizardState as any)}
      eventLabel="процедури"
    />
  );
};
