"use client";

import { useRecoveryWizard } from "./RecoveryWizardContext";
import { WizardStep2Wrapper } from "@/components/shared/wizard/WizardStep2Shared";

export const RecoveryWizardStep2 = () => {
  const wizardState = useRecoveryWizard();

  if (!wizardState.selectedMember) return null;

  return (
    <WizardStep2Wrapper
      {...(wizardState as any)}
      eventLabel="процедури"
    />
  );
};
