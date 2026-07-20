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

export const RecoveryWizardProvider: React.FC<ProviderProps> = (props) => {
  return (
    <ServiceSaleWizardProvider {...props} serviceType="recovery_service">
      {props.children}
    </ServiceSaleWizardProvider>
  );
};

export const useRecoveryWizard = () =>
  useServiceSaleWizard() as ServiceSaleWizardContextType;
