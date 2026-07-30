import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { ClubService, Member, Reservation } from "@/types";
import { Site } from "@/types/site.types";

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
  sendConfirmation: z.boolean().optional(),
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

export interface ReservationDialogContextType {
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
