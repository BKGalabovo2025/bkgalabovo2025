"use client";

import { useTrainingWizard } from "./TrainingWizardContext";
import { WizardStep2Wrapper } from "@/components/shared/wizard/WizardStep2Shared";

export const TrainingWizardStep2 = () => {
  const wizardState = useTrainingWizard();

  if (!wizardState.selectedMember) return null;

  return (
    <WizardStep2Wrapper
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(wizardState as any)}
      eventLabel="тренировки"
    />
  );
};
