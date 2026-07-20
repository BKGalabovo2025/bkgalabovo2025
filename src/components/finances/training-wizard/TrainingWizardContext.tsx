"use client";

import React from "react";
import {
  ServiceSaleWizardProvider,
  useServiceSaleWizard,
  ServiceSaleWizardContextType,
} from "@/components/shared/wizard/ServiceSaleWizardContext";

interface ProviderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any;
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void;
  children: React.ReactNode;
}

export const TrainingWizardProvider: React.FC<ProviderProps> = (props) => {
  return (
    <ServiceSaleWizardProvider {...props} serviceType="training_service">
      {props.children}
    </ServiceSaleWizardProvider>
  );
};

export const useTrainingWizard = () =>
  useServiceSaleWizard() as ServiceSaleWizardContextType;
