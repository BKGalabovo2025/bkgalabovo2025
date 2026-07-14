"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import * as z from "zod";
import { useForm, useWatch, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClubService, Reservation, Member } from "@/types";
import { Site } from "@/types/site.types";
import { useAppStore } from "@/store/use-app-store";

// Import hooks
import { useReservationData } from "./hooks/useReservationData";
import { useReservationPricing } from "./hooks/useReservationPricing";
import { useReservationNavigation } from "./hooks/useReservationNavigation";
import { useReservationSubmit } from "./hooks/useReservationSubmit";

export const reservationSchema = z.object({
  clientName: z
    .string()
    .min(2, { message: "Името трябва да е поне 2 символа." }),
  clientPhone: z.string().min(9, { message: "Невалиден телефонен номер." }),
  clientEmail: z
    .string()
    .email({ message: "Невалиден имейл адрес." })
    .optional()
    .or(z.literal("")),
  client2Name: z.string().optional(),
  client2Phone: z.string().optional(),
  client2Id: z.string().optional(),
  courtId: z.number().optional(),
  serviceId: z.string().optional(),
  selectedZone: z.string().optional(),
  client2Zone: z.string().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  memberId: z.string().optional(),
  paymentMethod: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export type ReservationFormValues = z.infer<typeof reservationSchema>;
export type Step = "time" | "packageDays" | "details" | "review";

export interface PackageDay {
  dayIndex: number;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  client1Zone?: string;
  client2Zone?: string;
}

interface ReservationDialogContextType {
  reservation?: Reservation;
  initialData?: Partial<ReservationFormValues>;
  onSave?: () => void;
  mode?: "courts" | "recovery";

  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving: boolean;
  currentStep: Step;
  setCurrentStep: React.Dispatch<React.SetStateAction<Step>>;

  services: ClubService[];
  siteInfo: Site | null;
  packageDays: PackageDay[];
  setPackageDays: React.Dispatch<React.SetStateAction<PackageDay[]>>;

  members: Member[];
  membersLoading: boolean;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  showMemberDropdown: boolean;
  setShowMemberDropdown: React.Dispatch<React.SetStateAction<boolean>>;

  applyPaymentToPackage: boolean;
  setApplyPaymentToPackage: React.Dispatch<React.SetStateAction<boolean>>;
  ignoreWorkingHoursWarning: boolean;
  setIgnoreWorkingHoursWarning: React.Dispatch<React.SetStateAction<boolean>>;

  courtRentalPrice: number;
  isRecoveryZone: boolean;
  isEditMode: boolean;
  isTwoClients: boolean;
  price: number;
  groupedServices: { [key: string]: ClubService[] };

  form: UseFormReturn<ReservationFormValues>;
  watchedValues: ReservationFormValues;

  handleOpenChange: (open: boolean) => void;
  handleNext: () => Promise<void>;
  handleBack: () => void;
  onSubmit: (values: ReservationFormValues) => Promise<void>;
  checkWorkingHours: (date: Date) => string | null;
}

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
