"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from "react";
import * as z from "zod";
import { useForm, useWatch, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ClubService, Reservation } from "@/types";
import { Site } from "@/types/site.types";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/store/use-app-store";
import { getAllRecoveryServices } from "@/services/club-service";
import { getAllMembers } from "@/services/member-service";
import { getSiteById } from "@/services/site-service";
import { getGeneralServicesServerAction } from "@/lib/actions/general-services-server";
import {
  createReservationAction,
  updateReservationAction,
  createPackageReservationsAction,
  updatePackageReservationsAction,
  checkRecoveryInventoryAction,
} from "@/lib/actions/reservations";

export const reservationSchema = z.object({
  clientName: z.string().min(2, { message: "Името трябва да е поне 2 символа." }),
  clientPhone: z.string().min(9, { message: "Невалиден телефонен номер." }),
  clientEmail: z.string().email({ message: "Невалиден имейл адрес." }).optional().or(z.literal("")),
  client2Name: z.string().optional(),
  client2Phone: z.string().optional(),
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
  
  members: any[];
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

const ReservationDialogContext = createContext<ReservationDialogContextType | undefined>(undefined);

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
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("time");
  
  const [services, setServices] = useState<ClubService[]>([]);
  const [siteInfo, setSiteInfo] = useState<Site | null>(null);
  const [packageDays, setPackageDays] = useState<PackageDay[]>([]);
  
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  
  const [applyPaymentToPackage, setApplyPaymentToPackage] = useState(true);
  const [ignoreWorkingHoursWarning, setIgnoreWorkingHoursWarning] = useState(false);
  const [courtRentalPrice, setCourtRentalPrice] = useState(10);

  const { activeBranch } = useAppStore();
  const { getFreshToken } = useAuth();
  
  const isRecoveryZone = mode === "recovery" || activeBranch === "recoveryzone";
  const isEditMode = !!reservation;

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
  });

  const { reset, control, trigger } = form;
  const watchedValues = useWatch({ control }) as ReservationFormValues;

  // Effects
  useEffect(() => {
    if (isOpen) {
      setMembersLoading(true);
      getAllMembers()
        .then((data) => setMembers(data))
        .catch((err) => console.error("Error loading members:", err))
        .finally(() => setMembersLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isRecoveryZone) {
      getAllRecoveryServices().then((data: ClubService[]) => {
        setServices(data.filter((s) => s.requiresBooking));
      });
      getSiteById("recoveryzone").then((site) => {
        if (site) setSiteInfo(site as Site);
      });
    }
  }, [isRecoveryZone]);

  useEffect(() => {
    if (isOpen && !isRecoveryZone) {
      getGeneralServicesServerAction(activeBranch)
        .then((res) => {
          if (res.success && res.data) {
            const courtService = res.data.find((s) =>
              s.name?.toLowerCase()?.trim()?.includes("наем на корт")
            );
            if (courtService && courtService.price) {
              setCourtRentalPrice(courtService.price);
            }
          }
        })
        .catch((err) => console.error("Error loading general services:", err));
    }
  }, [isOpen, isRecoveryZone, activeBranch]);

  useEffect(() => {
    if (isRecoveryZone && watchedValues.serviceId && watchedValues.startTime) {
      const selectedService = services.find((s) => s.id === watchedValues.serviceId);
      if (selectedService && selectedService.durationMinutes) {
        const newEndTime = new Date(
          watchedValues.startTime.getTime() + selectedService.durationMinutes * 60000
        );
        if (!watchedValues.endTime || watchedValues.endTime.getTime() !== newEndTime.getTime()) {
          form.setValue("endTime", newEndTime);
        }
      }
    }
  }, [watchedValues.serviceId, watchedValues.startTime, isRecoveryZone, services, form, watchedValues.endTime]);

  // Derived state
  const isTwoClients = useMemo(() => {
    const s = services.find((s) => s.id === watchedValues.serviceId);
    if (!s || !s.name) return false;
    const name = s.name.toLowerCase();
    return name.includes("двама") || name.includes("2-ма") || name.includes("2ма");
  }, [services, watchedValues.serviceId]);

  const price = useMemo(() => {
    if (isRecoveryZone) {
      const selectedService = services.find((s) => s.id === watchedValues.serviceId);
      return selectedService?.price || 0;
    }
    if (watchedValues.startTime && watchedValues.endTime && watchedValues.endTime > watchedValues.startTime) {
      const durationHours = (watchedValues.endTime.getTime() - watchedValues.startTime.getTime()) / (1000 * 60 * 60);
      return durationHours * courtRentalPrice;
    }
    return 0;
  }, [watchedValues.startTime, watchedValues.endTime, watchedValues.serviceId, isRecoveryZone, services, courtRentalPrice]);

  const groupedServices = useMemo(() => {
    const groups: { [key: string]: ClubService[] } = {};
    services.forEach((s) => {
      const cat = s.category || "Други";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [services]);

  const checkWorkingHours = (date: Date): string | null => {
    if (!siteInfo?.schedule) return null;
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const day = dayNames[date.getDay()];
    const daySchedule = siteInfo.schedule[day as keyof typeof siteInfo.schedule];

    if (!daySchedule?.isOpen) return "Този ден е отбелязан като неработен за обекта.";

    const timeStr = date.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
    if (timeStr < daySchedule.open || timeStr > daySchedule.close) {
      return `Избраният час е извън работното време (${daySchedule.open} - ${daySchedule.close}).`;
    }
    return null;
  };

  const cleanPayload = (obj: any) => {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
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
          notes: reservation.notes || "",
        });
      } else {
        reset({
          clientName: "",
          clientPhone: "",
          clientEmail: "",
          client2Name: "",
          client2Phone: "",
          notes: "",
          ...initialData,
        });
      }
    }
  };

  const handleNext = async () => {
    if (currentStep === "time") {
      let isPackage = false;
      let daysCount = 1;
      const selectedService = services.find((s) => s.id === watchedValues.serviceId);
      if (selectedService?.name) {
        const nameL = selectedService.name.toLowerCase();
        if (nameL.includes("2 дни")) { isPackage = true; daysCount = 2; }
        else if (nameL.includes("3 дни") || nameL.includes("тридневен")) { isPackage = true; daysCount = 3; }
      }

      const fieldsToTrigger: Array<keyof ReservationFormValues> = [];
      if (!isPackage) {
        fieldsToTrigger.push("startTime", "endTime");
      }
      if (!isRecoveryZone) fieldsToTrigger.push("courtId");
      else {
        fieldsToTrigger.push("serviceId");
        if (selectedService && (selectedService.zones?.length || 0) > 1 && !isPackage) {
          fieldsToTrigger.push("selectedZone");
        }
      }

      const isValid = await trigger(fieldsToTrigger);
      if (isValid) {
        if (watchedValues.startTime) {
          const warning = checkWorkingHours(watchedValues.startTime);
          if (warning && !ignoreWorkingHoursWarning) {
            toast.error(warning, { duration: 5000 });
            return;
          }
        }

        let hasError = false;
        if (isRecoveryZone) {
          let reqComp = 0;
          const reqAtts = { legs: 0, arms: 0, hips: 0 };

          if (watchedValues.selectedZone) {
            reqComp++;
            const z = watchedValues.selectedZone.toUpperCase();
            if (z === "КРАКА") reqAtts.legs++;
            if (z === "РЪЦЕ") reqAtts.arms++;
            if (z === "ТАЗ") reqAtts.hips++;
          }
          if (isTwoClients && watchedValues.client2Zone) {
            reqComp++;
            const z2 = watchedValues.client2Zone.toUpperCase();
            if (z2 === "КРАКА") reqAtts.legs++;
            if (z2 === "РЪЦЕ") reqAtts.arms++;
            if (z2 === "ТАЗ") reqAtts.hips++;
          }

          if (watchedValues.startTime && watchedValues.endTime) {
            const startTimeObj = new Date(watchedValues.startTime.getTime() - watchedValues.startTime.getTimezoneOffset() * 60000);
            const endTimeObj = new Date(watchedValues.endTime.getTime() - watchedValues.endTime.getTimezoneOffset() * 60000);

            const inventoryCheck = await checkRecoveryInventoryAction(
              "recoveryzone",
              startTimeObj.toISOString(),
              endTimeObj.toISOString(),
              { compressors: reqComp, attachments: reqAtts }
            );

            if (!inventoryCheck.success) {
              toast.error(inventoryCheck.message);
              hasError = true;
            }
          }
        }

        if (hasError) return;

        if (isPackage && daysCount > 1) {
          const newDays: PackageDay[] = [];
          const baseStart = watchedValues.startTime || new Date();
          const baseEnd = watchedValues.endTime || new Date(baseStart.getTime() + (selectedService?.durationMinutes || 60) * 60000);

          for (let i = 0; i < daysCount; i++) {
            const nextDate = new Date(baseStart);
            nextDate.setDate(nextDate.getDate() + i);
            const nextEndTime = new Date(baseEnd);
            nextEndTime.setDate(nextEndTime.getDate() + i);
            newDays.push({
              dayIndex: i,
              date: nextDate,
              startTime: nextDate,
              endTime: nextEndTime,
              client1Zone: i === 0 ? watchedValues.selectedZone : "",
              client2Zone: i === 0 ? watchedValues.client2Zone : "",
            });
          }
          setPackageDays(newDays);
          setCurrentStep("packageDays");
        } else {
          setCurrentStep("details");
        }
      } else {
        if (form.formState.errors.endTime) toast.error("Крайният час е невалиден.");
        else toast.error("Моля, попълнете всички задължителни полета.");
      }
    } else if (currentStep === "packageDays") {
      let hasError = false;
      for (const p of packageDays) {
        if (p.startTime) {
          const warning = checkWorkingHours(p.startTime);
          if (warning && !ignoreWorkingHoursWarning) {
            toast.error(`Ден ${p.dayIndex + 1}: ${warning}`, { duration: 5000 });
            hasError = true;
          }
        }
        if (isRecoveryZone) {
          let reqComp = 0;
          const reqAtts = { legs: 0, arms: 0, hips: 0 };
          if (p.client1Zone) {
            reqComp++;
            const z = p.client1Zone.toUpperCase();
            if (z === "КРАКА") reqAtts.legs++;
            if (z === "РЪЦЕ") reqAtts.arms++;
            if (z === "ТАЗ") reqAtts.hips++;
          } else {
            toast.error(`Ден ${p.dayIndex + 1}: Моля, изберете зона за Клиент 1.`);
            hasError = true;
          }
          if (isTwoClients) {
            if (p.client2Zone) {
              reqComp++;
              const z2 = p.client2Zone.toUpperCase();
              if (z2 === "КРАКА") reqAtts.legs++;
              if (z2 === "РЪЦЕ") reqAtts.arms++;
              if (z2 === "ТАЗ") reqAtts.hips++;
            } else {
              toast.error(`Ден ${p.dayIndex + 1}: Моля, изберете зона за Клиент 2.`);
              hasError = true;
            }
          }

          if (!hasError && p.startTime && p.endTime) {
            const stObj = new Date(p.startTime);
            const etObj = new Date(p.endTime);
            const startTimeIso = new Date(stObj.getTime() - stObj.getTimezoneOffset() * 60000).toISOString();
            const endTimeIso = new Date(etObj.getTime() - etObj.getTimezoneOffset() * 60000).toISOString();

            const inventoryCheck = await checkRecoveryInventoryAction(
              "recoveryzone",
              startTimeIso,
              endTimeIso,
              { compressors: reqComp, attachments: reqAtts }
            );

            if (!inventoryCheck.success) {
              toast.error(`Ден ${p.dayIndex + 1}: ${inventoryCheck.message}`);
              hasError = true;
            }
          }
        }
      }
      if (!hasError) setCurrentStep("details");
    } else if (currentStep === "details") {
      const triggers: Array<keyof ReservationFormValues> = ["clientName", "clientPhone", "clientEmail"];
      if (isTwoClients) {
        triggers.push("client2Name", "client2Phone");
      }
      const isValid = await trigger(triggers);

      if (isTwoClients && (!form.getValues("client2Name") || form.getValues("client2Name")!.length < 2)) {
        form.setError("client2Name", { message: "Името е задължително за пакети за двама." });
        return;
      }

      if (isValid) setCurrentStep("review");
    }
  };

  const handleBack = () => {
    if (currentStep === "details") setCurrentStep(packageDays.length > 0 ? "packageDays" : "time");
    else if (currentStep === "review") setCurrentStep("details");
    else if (currentStep === "packageDays") setCurrentStep("time");
  };

  const onSubmit = async (values: ReservationFormValues) => {
    const token = await getFreshToken(true);
    if (!token) {
      toast.error("Грешка при оторизация");
      return;
    }

    setIsSaving(true);
    try {
      const selectedService = services.find((s) => s.id === values.serviceId);
      let result;

      if (packageDays.length > 0 && !isEditMode) {
        const allReservations = [];
        for (const pd of packageDays) {
          let finalResources = selectedService?.requiredResources;
          if (isRecoveryZone) {
            let reqComp = 0, reqLegs = 0, reqArms = 0, reqHips = 0;
            if (pd.client1Zone) {
              reqComp++;
              if (pd.client1Zone === "Крака") reqLegs++;
              if (pd.client1Zone === "Ръце") reqArms++;
              if (pd.client1Zone === "Таз") reqHips++;
            }
            if (isTwoClients && pd.client2Zone) {
              reqComp++;
              if (pd.client2Zone === "Крака") reqLegs++;
              if (pd.client2Zone === "Ръце") reqArms++;
              if (pd.client2Zone === "Таз") reqHips++;
            }
            if (reqComp > 0) {
              finalResources = { compressors: reqComp, attachments: { legs: reqLegs, arms: reqArms, hips: reqHips } };
            }
          }

          allReservations.push(
            cleanPayload({
              ...values,
              siteId: isRecoveryZone ? "recoveryzone" : activeBranch,
              startTime: pd.startTime?.toISOString(),
              endTime: pd.endTime?.toISOString(),
              totalPrice: price,
              price: price,
              finalPrice: price,
              currency: "EUR",
              serviceName: selectedService?.name,
              usedResources: finalResources,
              selectedZone: pd.client1Zone,
              client2Zone: pd.client2Zone,
              client2Name: values.client2Name,
              client2Phone: values.client2Phone,
              isExclusive: selectedService?.isExclusive ?? false,
              bufferAfter: selectedService?.bufferAfter ?? 5,
              status: values.status || "unpaid",
              paymentMethod: values.paymentMethod || "Cash",
            })
          );
        }
        result = await createPackageReservationsAction(token, allReservations, values.paymentMethod || "Cash");
      } else {
        let finalResources = selectedService?.requiredResources;
        if (isRecoveryZone) {
          let reqComp = 0, reqLegs = 0, reqArms = 0, reqHips = 0;
          if (values.selectedZone) {
            reqComp++;
            if (values.selectedZone === "Крака") reqLegs++;
            if (values.selectedZone === "Ръце") reqArms++;
            if (values.selectedZone === "Таз") reqHips++;
          }
          if (isTwoClients && values.client2Zone) {
            reqComp++;
            if (values.client2Zone === "Крака") reqLegs++;
            if (values.client2Zone === "Ръце") reqArms++;
            if (values.client2Zone === "Таз") reqHips++;
          }
          if (reqComp > 0) {
            finalResources = { compressors: reqComp, attachments: { legs: reqLegs, arms: reqArms, hips: reqHips } };
          }
        }

        const dataToSave = cleanPayload({
          ...values,
          siteId: isRecoveryZone ? "recoveryzone" : activeBranch,
          startTime: values.startTime?.toISOString(),
          endTime: values.endTime?.toISOString(),
          totalPrice: price,
          price: price,
          finalPrice: price,
          currency: "EUR",
          serviceName: selectedService?.name,
          usedResources: finalResources,
          selectedZone: values.selectedZone,
          client2Zone: values.client2Zone,
          isExclusive: selectedService?.isExclusive ?? false,
          bufferAfter: selectedService?.bufferAfter ?? 5,
        });

        if (isEditMode && reservation) {
          result = await updateReservationAction(token, reservation.id, {
            ...dataToSave,
            status: reservation.packageGroupId && applyPaymentToPackage && values.status !== reservation.status
                ? reservation.status
                : values.status || "unpaid",
            paymentMethod: values.paymentMethod || "Cash",
          });

          if (result.success && reservation.packageGroupId) {
            result = await updatePackageReservationsAction(token, reservation.packageGroupId, {
              ...dataToSave,
              ...(applyPaymentToPackage && values.status !== reservation.status
                ? { status: values.status || "unpaid", paymentMethod: values.paymentMethod || "Cash" }
                : {}),
            });
          }
        } else {
          result = await createReservationAction(token, {
            ...dataToSave,
            status: values.status || "unpaid",
            paymentMethod: values.paymentMethod || "Cash",
          });
        }
      }

      if (result.success) {
        toast.success(result.message);
        onSave?.();
        setIsOpen(false);
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Failed to save reservation:", error);
      toast.error("Възникна системна грешка при запазването.");
    } finally {
      setIsSaving(false);
    }
  };

  const contextValue: ReservationDialogContextType = {
    reservation, initialData, onSave, mode,
    isOpen, setIsOpen,
    isSaving, currentStep, setCurrentStep,
    services, siteInfo, packageDays, setPackageDays,
    members, membersLoading, searchTerm, setSearchTerm, showMemberDropdown, setShowMemberDropdown,
    applyPaymentToPackage, setApplyPaymentToPackage,
    ignoreWorkingHoursWarning, setIgnoreWorkingHoursWarning,
    courtRentalPrice, isRecoveryZone, isEditMode, isTwoClients, price, groupedServices,
    form, watchedValues,
    handleOpenChange, handleNext, handleBack, onSubmit, checkWorkingHours,
  };

  return <ReservationDialogContext.Provider value={contextValue}>{children}</ReservationDialogContext.Provider>;
};

export const useReservationDialog = () => {
  const context = useContext(ReservationDialogContext);
  if (!context) {
    throw new Error("useReservationDialog must be used within a ReservationDialogProvider");
  }
  return context;
};
