"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useAppStore } from "@/store/use-app-store";
import { Reservation } from "@/types";

// Import hooks
import { useReservationData } from "./hooks/useReservationData";
import { useReservationNavigation } from "./hooks/useReservationNavigation";
import { useReservationPricing } from "./hooks/useReservationPricing";
import { useReservationSubmit } from "./hooks/useReservationSubmit";
import {
  ReservationDialogContextType,
  ReservationFormValues,
  reservationSchema,
} from "./reservation-dialog-types";

const ReservationDialogContext = createContext<
  ReservationDialogContextType | undefined
>(undefined);

interface ReservationDialogProviderProps {
  children: ReactNode;
  reservation?: Reservation;
  initialData?: Partial<ReservationFormValues>;
  onSave?: () => void;
  mode?: "courts" | "recovery";
}

export const ReservationDialogProvider = ({
  children,
  reservation,
  initialData,
  onSave,
  mode,
}: ReservationDialogProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [applyPaymentToPackage, setApplyPaymentToPackage] = useState(true);
  const [ignoreWorkingHoursWarning, setIgnoreWorkingHoursWarning] =
    useState(false);

  const { activeBranch } = useAppStore();
  const isRecoveryZone = mode === "recovery" || activeBranch === "recoveryzone";
  const isEditMode = !!reservation;

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
  });

  const { reset, control } = form;
  const watchedValues = useWatch({ control }) as ReservationFormValues;

  // Custom Hooks
  const { services, siteInfo, members, membersLoading, courtRentalPrice } =
    useReservationData(isOpen, isRecoveryZone);

  const { isTwoClients, price, groupedServices } = useReservationPricing(
    form,
    watchedValues,
    services,
    isRecoveryZone,
    courtRentalPrice
  );

  const {
    currentStep,
    setCurrentStep,
    packageDays,
    setPackageDays,
    handleNext,
    handleBack,
    checkWorkingHours,
  } = useReservationNavigation(
    form,
    watchedValues,
    services,
    siteInfo,
    isRecoveryZone,
    isTwoClients,
    ignoreWorkingHoursWarning
  );

  const { isSaving, onSubmit } = useReservationSubmit(
    isRecoveryZone,
    activeBranch,
    price,
    services,
    packageDays,
    reservation,
    applyPaymentToPackage,
    onSave,
    setIsOpen
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) return;

    setCurrentStep("time");
    setIgnoreWorkingHoursWarning(false);

    if (isEditMode && reservation) {
      reset({
        ...reservation,
        startTime: reservation.startTime.toDate(),
        endTime: reservation.endTime.toDate(),
        clientName: reservation.clientName || "",
        clientPhone: reservation.clientPhone || "",
        clientEmail: reservation.clientEmail || "",
        client2Name: reservation.client2Name || "",
        client2Phone: reservation.client2Phone || "",
        client2Id: reservation.client2Id || "",
        notes: reservation.notes || "",
      });
    } else {
      reset({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        client2Name: "",
        client2Phone: "",
        client2Id: "",
        notes: "",
        startTime: new Date(),
        ...initialData,
      });
    }
  };

  const contextValue: ReservationDialogContextType = {
    reservation,
    initialData,
    onSave,
    mode,
    isOpen,
    setIsOpen,
    isSaving,
    currentStep,
    setCurrentStep,
    services,
    siteInfo,
    packageDays,
    setPackageDays,
    members,
    membersLoading,
    searchTerm,
    setSearchTerm,
    showMemberDropdown,
    setShowMemberDropdown,
    applyPaymentToPackage,
    setApplyPaymentToPackage,
    ignoreWorkingHoursWarning,
    setIgnoreWorkingHoursWarning,
    courtRentalPrice,
    isRecoveryZone,
    isEditMode,
    isTwoClients,
    price,
    groupedServices,
    form,
    watchedValues,
    handleOpenChange,
    handleNext,
    handleBack,
    onSubmit,
    checkWorkingHours,
  };

  return (
    <ReservationDialogContext.Provider value={contextValue}>
      {children}
    </ReservationDialogContext.Provider>
  );
};

export const useReservationDialog = () => {
  const context = useContext(ReservationDialogContext);
  if (!context) {
    throw new Error(
      "useReservationDialog must be used within a ReservationDialogProvider"
    );
  }
  return context;
};
