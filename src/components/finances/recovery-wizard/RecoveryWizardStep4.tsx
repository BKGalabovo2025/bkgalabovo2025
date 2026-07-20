"use client";

import { useRecoveryWizard } from "./RecoveryWizardContext";
import { WizardStep4Shared } from "@/components/shared/wizard/WizardStep4Shared";

export const RecoveryWizardStep4 = () => {
  const wizardState = useRecoveryWizard();

  return <WizardStep4Shared {...wizardState} itemNamePlural="процедури" />;
};
