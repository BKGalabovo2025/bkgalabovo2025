"use client";

import { useTrainingWizard } from "./TrainingWizardContext";
import { WizardStep4Shared } from "@/components/shared/wizard/WizardStep4Shared";

export const TrainingWizardStep4 = () => {
  const wizardState = useTrainingWizard();

  return <WizardStep4Shared {...wizardState} itemNamePlural="тренировки" />;
};
