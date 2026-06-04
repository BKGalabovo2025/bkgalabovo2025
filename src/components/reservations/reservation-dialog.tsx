import React, { useState, useMemo } from "react";
import * as z from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  CalendarRange,
  Calendar,
  User,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Activity,
} from "lucide-react";
import {
  createReservationAction,
  updateReservationAction,
  createPackageReservationsAction,
  updatePackageReservationsAction,
} from "@/lib/actions/reservations";
import { getGeneralServicesServerAction } from "@/lib/actions/general-services-server";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { useAppStore } from "@/store/use-app-store";
import { toast } from "sonner";
import { Reservation } from "@/types/reservation";
import { ClubService } from "@/types";
import { getAllRecoveryServices } from "@/services/club-service";
import { cn } from "@/lib/utils";
import { getAllMembers } from "@/services/member-service";
import { getSiteById } from "@/services/site-service";
import { Site } from "@/types/site.types";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

const reservationSchema = z.object({
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
  courtId: z.number().optional(),
  serviceId: z.string().optional(),
  selectedZone: z.string().optional(),
  client2Zone: z.string().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  memberId: z.string().optional(),
  paymentMethod: z.string().optional(),
  status: z.string().optional(),
});

interface ReservationDialogProps {
  children: React.ReactNode;
  reservation?: Reservation;
  initialData?: Partial<z.infer<typeof reservationSchema>>;
  onSave?: () => void;
  mode?: "courts" | "recovery";
}

type Step = "time" | "packageDays" | "details" | "review";

export const ReservationDialog: React.FC<ReservationDialogProps> = ({
  children,
  reservation,
  initialData,
  onSave,
  mode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("time");
  const [services, setServices] = useState<ClubService[]>([]);
  const [siteInfo, setSiteInfo] = useState<Site | null>(null);
  const [packageDays, setPackageDays] = useState<
    {
      dayIndex: number;
      date: Date | null;
      startTime: Date | null;
      endTime: Date | null;
      client1Zone?: string;
      client2Zone?: string;
    }[]
  >([]);
  const { activeBranch } = useAppStore();
  const isRecoveryZone = mode === "recovery" || activeBranch === "recoveryzone";

  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [applyPaymentToPackage, setApplyPaymentToPackage] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setMembersLoading(true);
      getAllMembers()
        .then((data) => {
          setMembers(data);
        })
        .catch((err) => {
          console.error("Error loading members in reservation dialog:", err);
        })
        .finally(() => {
          setMembersLoading(false);
        });
    }
  }, [isOpen]);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isRecoveryZone) {
      getAllRecoveryServices().then((data: ClubService[]) => {
        setServices(data.filter((s: ClubService) => s.requiresBooking));
      });
      getSiteById("recoveryzone").then((site) => {
        if (site) setSiteInfo(site as any);
      });
    }
  }, [isRecoveryZone]);

  const { getFreshToken } = useAuth();

  const [courtRentalPrice, setCourtRentalPrice] = useState(10);

  React.useEffect(() => {
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
        .catch((err) => {
          console.error(
            "Error loading general services for court rental price:",
            err
          );
        });
    }
  }, [isOpen, isRecoveryZone, activeBranch]);

  const cleanPayload = (obj: any) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined)
    );
  };

  const isEditMode = !!reservation;

  const form = useForm<z.infer<typeof reservationSchema>>({
    resolver: zodResolver(reservationSchema),
  });

  const { reset, control, trigger } = form;
  const watchedValues = useWatch({ control });
  const {
    startTime,
    endTime,
    courtId,
    serviceId,
    clientName,
    clientPhone,
    clientEmail,
    selectedZone,
    client2Zone,
  } = watchedValues;

  const isTwoClients = useMemo(() => {
    const s = services.find((s) => s.id === serviceId);
    if (!s || !s.name) return false;
    const name = s.name.toLowerCase();
    return (
      name.includes("двама") || name.includes("2-ма") || name.includes("2ма")
    );
  }, [services, serviceId]);

  // Auto-calculate endTime based on service duration
  React.useEffect(() => {
    if (isRecoveryZone && serviceId && startTime) {
      const selectedService = services.find((s) => s.id === serviceId);
      if (selectedService && selectedService.durationMinutes) {
        const newEndTime = new Date(
          startTime.getTime() + selectedService.durationMinutes * 60000
        );
        // Only update if it's different to avoid infinite loop
        if (!endTime || endTime.getTime() !== newEndTime.getTime()) {
          form.setValue("endTime", newEndTime);
        }
      }
    }
  }, [serviceId, startTime, isRecoveryZone, services, form, endTime]);

  const price = useMemo(() => {
    if (isRecoveryZone) {
      const selectedService = services.find((s) => s.id === serviceId);
      return selectedService?.price || 0;
    }
    if (startTime && endTime && endTime > startTime) {
      const durationHours =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return durationHours * courtRentalPrice;
    }
    return 0;
  }, [
    startTime,
    endTime,
    serviceId,
    isRecoveryZone,
    services,
    courtRentalPrice,
  ]);

  const groupedServices = useMemo(() => {
    const groups: { [key: string]: ClubService[] } = {};
    services.forEach((s) => {
      const cat = s.category || "Други";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [services]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setCurrentStep("time");
      if (isEditMode && reservation) {
        reset({
          ...reservation,
          startTime: reservation.startTime.toDate(),
          endTime: reservation.endTime.toDate(),
        });
      } else {
        reset({
          clientName: "",
          clientPhone: "",
          clientEmail: "",
          ...initialData,
        });
      }
    }
  };

  const checkWorkingHours = (date: Date): string | null => {
    if (!siteInfo?.schedule) return null;
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const day = dayNames[date.getDay()];
    const daySchedule =
      siteInfo.schedule[day as keyof typeof siteInfo.schedule];

    if (!daySchedule?.isOpen)
      return "Този ден е отбелязан като неработен за обекта.";

    const timeStr = date.toLocaleTimeString("bg-BG", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (timeStr < daySchedule.open || timeStr > daySchedule.close) {
      return `Избраният час е извън работното време (${daySchedule.open} - ${daySchedule.close}).`;
    }
    return null;
  };

  const handleNext = async () => {
    if (currentStep === "time") {
      let isPackage = false;
      let daysCount = 1;
      const selectedService = services.find((s) => s.id === serviceId);
      if (selectedService?.name) {
        const nameL = selectedService.name.toLowerCase();
        if (nameL.includes("2 дни")) {
          isPackage = true;
          daysCount = 2;
        } else if (nameL.includes("3 дни") || nameL.includes("тридневен")) {
          isPackage = true;
          daysCount = 3;
        }
      }

      const fieldsToTrigger: Array<keyof z.infer<typeof reservationSchema>> =
        [];
      if (!isPackage) {
        fieldsToTrigger.push("startTime");
        fieldsToTrigger.push("endTime");
      }
      if (!isRecoveryZone) fieldsToTrigger.push("courtId");
      else {
        fieldsToTrigger.push("serviceId");
        if (
          selectedService &&
          (selectedService.zones?.length || 0) > 1 &&
          !isPackage
        ) {
          fieldsToTrigger.push("selectedZone");
        }
      }

      const isValid = await trigger(fieldsToTrigger);
      if (isValid) {
        if (!isPackage && startTime) {
          const warning = checkWorkingHours(startTime);
          if (warning) toast.error(warning, { duration: 5000 });
        }

        if (isPackage && daysCount > 1) {
          // Smart Auto Fill
          const newDays = [];
          const baseStart = startTime || new Date();
          const baseEnd =
            endTime ||
            new Date(
              baseStart.getTime() +
                (selectedService?.durationMinutes || 60) * 60000
            );

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
              client1Zone: i === 0 ? selectedZone : "",
              client2Zone: i === 0 ? client2Zone : "",
            });
          }
          setPackageDays(newDays);
          setCurrentStep("packageDays");
        } else {
          setCurrentStep("details");
        }
      } else {
        if (form.formState.errors.endTime)
          toast.error("Крайният час е невалиден.");
        else toast.error("Моля, попълнете всички задължителни полета.");
      }
    } else if (currentStep === "packageDays") {
      let hasError = false;
      // Validate each day's resources
      for (const p of packageDays) {
        if (p.startTime) {
          const warning = checkWorkingHours(p.startTime);
          if (warning)
            toast.error(`Ден ${p.dayIndex + 1}: ${warning}`, {
              duration: 5000,
            });
        }
        if (isRecoveryZone && siteInfo?.inventory) {
          let reqComp = 0;
          const reqAtts = { legs: 0, arms: 0, hips: 0 };
          if (p.client1Zone) {
            reqComp++;
            if (p.client1Zone === "Крака") reqAtts.legs++;
            if (p.client1Zone === "Ръце") reqAtts.arms++;
            if (p.client1Zone === "Таз") reqAtts.hips++;
          } else {
            toast.error(
              `Ден ${p.dayIndex + 1}: Моля, изберете зона за Клиент 1.`
            );
            hasError = true;
          }
          if (isTwoClients) {
            if (p.client2Zone) {
              reqComp++;
              if (p.client2Zone === "Крака") reqAtts.legs++;
              if (p.client2Zone === "Ръце") reqAtts.arms++;
              if (p.client2Zone === "Таз") reqAtts.hips++;
            } else {
              toast.error(
                `Ден ${p.dayIndex + 1}: Моля, изберете зона за Клиент 2.`
              );
              hasError = true;
            }
          }

          const inv = siteInfo.inventory.attachments || {};
          const invComp = siteInfo.inventory.compressors || 0;

          if (reqComp > invComp) {
            toast.error(
              `Ден ${p.dayIndex + 1}: Нямате достатъчно компресори (търсени ${reqComp}, налични ${invComp}).`
            );
            hasError = true;
          }
          if (reqAtts.legs > (inv.legs || 0)) {
            toast.error(
              `Ден ${p.dayIndex + 1}: Нямате достатъчно приставки КРАКА.`
            );
            hasError = true;
          }
          if (reqAtts.arms > (inv.arms || 0)) {
            toast.error(
              `Ден ${p.dayIndex + 1}: Нямате достатъчно приставки РЪЦЕ.`
            );
            hasError = true;
          }
          if (reqAtts.hips > (inv.hips || 0)) {
            toast.error(
              `Ден ${p.dayIndex + 1}: Нямате достатъчно приставки ТАЗ.`
            );
            hasError = true;
          }
        }
      }
      if (!hasError) setCurrentStep("details");
    } else if (currentStep === "details") {
      const triggers: any[] = ["clientName", "clientPhone", "clientEmail"];
      if (isTwoClients) {
        triggers.push("client2Name", "client2Phone");
      }
      const isValid = await trigger(triggers);

      if (
        isTwoClients &&
        (!form.getValues("client2Name") ||
          form.getValues("client2Name")!.length < 2)
      ) {
        form.setError("client2Name", {
          message: "Името е задължително за пакети за двама.",
        });
        return;
      }

      if (isValid) setCurrentStep("review");
    }
  };

  const handleBack = () => {
    if (currentStep === "details")
      setCurrentStep(packageDays.length > 0 ? "packageDays" : "time");
    else if (currentStep === "review") setCurrentStep("details");
    else if (currentStep === "packageDays") setCurrentStep("time");
  };

  async function onSubmit(values: z.infer<typeof reservationSchema>) {
    const token = await getFreshToken(true);
    if (!token) {
      toast.error("Грешка при оторизация");
      return;
    }

    setIsSaving(true);
    try {
      const selectedService = services.find((s) => s.id === values.serviceId);

      // Dynamic resource adjustment based on selected zone
      let result;
      if (packageDays.length > 0 && !isEditMode) {
        const allReservations = [];
        for (const pd of packageDays) {
          let finalResources = selectedService?.requiredResources;
          if (isRecoveryZone) {
            let reqComp = 0,
              reqLegs = 0,
              reqArms = 0,
              reqHips = 0;
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
              finalResources = {
                compressors: reqComp,
                attachments: { legs: reqLegs, arms: reqArms, hips: reqHips },
              };
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
        result = await createPackageReservationsAction(
          token,
          allReservations,
          values.paymentMethod || "Cash"
        );
      } else {
        let finalResources = selectedService?.requiredResources;
        if (isRecoveryZone) {
          let reqComp = 0,
            reqLegs = 0,
            reqArms = 0,
            reqHips = 0;
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
            finalResources = {
              compressors: reqComp,
              attachments: { legs: reqLegs, arms: reqArms, hips: reqHips },
            };
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

        if (isEditMode) {
          result = await updateReservationAction(token, reservation.id, {
            ...dataToSave,
            status:
              reservation?.packageGroupId &&
              applyPaymentToPackage &&
              values.status !== reservation.status
                ? reservation.status
                : values.status || "unpaid",
            paymentMethod: values.paymentMethod || "Cash",
          });

          if (
            result.success &&
            reservation?.packageGroupId &&
            applyPaymentToPackage &&
            values.status !== reservation.status
          ) {
            result = await updatePackageReservationsAction(
              token,
              reservation.packageGroupId,
              {
                status: values.status || "unpaid",
                paymentMethod: values.paymentMethod || "Cash",
              }
            );
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
  }

  const steps = [
    {
      id: "time",
      label: !isRecoveryZone ? "Час & Корт" : "Услуга & Час",
      icon: !isRecoveryZone ? Calendar : Activity,
    },
    { id: "details", label: "Клиент", icon: User },
    { id: "review", label: "Преглед", icon: ClipboardCheck },
  ];

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-4xl border-zinc-100 dark:border-zinc-900 shadow-2xl p-0 overflow-hidden">
        {/* Wizard Header / Progress */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center justify-between mb-8">
            <div>
              <DialogTitle className="text-2xl font-black text-zinc-950 dark:text-white tracking-tighter uppercase italic">
                {isEditMode ? "Редактиране" : "Резервация"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                {isEditMode
                  ? "Актуализиране на съществуваща резервация"
                  : "Създаване на нов график"}
              </DialogDescription>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              {currentStep === "time" && <CalendarRange className="w-6 h-6" />}
              {currentStep === "details" && <User className="w-6 h-6" />}
              {currentStep === "review" && (
                <ClipboardCheck className="w-6 h-6" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPast = steps.findIndex((s) => s.id === currentStep) > idx;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500",
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                          : isPast
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                      )}
                    >
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest hidden sm:block",
                        isActive
                          ? "text-zinc-900 dark:text-white"
                          : "text-zinc-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800 mx-2" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Only allow default enter submission on the final step
                  if (currentStep !== "review") {
                    e.preventDefault();
                    handleNext();
                  }
                }
              }}
            >
              {/* Step 1: Time & Court */}
              {currentStep === "time" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {!isRecoveryZone ? (
                    <FormField
                      control={form.control}
                      name="courtId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> Изберете Корт
                          </FormLabel>
                          <div className="grid grid-cols-3 gap-3">
                            {Array.from({ length: 6 }, (_, i) => i + 1).map(
                              (num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => field.onChange(num)}
                                  className={cn(
                                    "h-14 rounded-2xl font-bold transition-all border-2",
                                    field.value === num
                                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                                  )}
                                >
                                  {num}
                                </button>
                              )
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="serviceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Изберете Услуга
                          </FormLabel>
                          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-100 dark:scrollbar-thumb-zinc-800">
                            {Object.entries(groupedServices).map(
                              ([category, catServices]) => (
                                <div key={category} className="space-y-3">
                                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">
                                    {category}
                                  </h3>
                                  <div className="space-y-2">
                                    {catServices.map((s) => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                          field.onChange(s.id);
                                          // Auto-set end time based on duration
                                          if (startTime) {
                                            form.setValue(
                                              "endTime",
                                              new Date(
                                                startTime.getTime() +
                                                  s.durationMinutes * 60000
                                              )
                                            );
                                          }
                                        }}
                                        className={cn(
                                          "w-full px-5 h-14 rounded-2xl font-bold transition-all border-2 flex items-center justify-between",
                                          field.value === s.id
                                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                                        )}
                                      >
                                        <span className="text-xs uppercase tracking-tight">
                                          {s.name}
                                        </span>
                                        <span className="text-[10px] opacity-70">
                                          {s.durationMinutes} мин •{" "}
                                          {formatPrice(s.price)}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Zone Selection for Recovery Zone */}
                  {isRecoveryZone && serviceId && (
                    <FormField
                      control={form.control}
                      name="selectedZone"
                      render={({ field }) => {
                        const selectedService = services.find(
                          (s) => s.id === serviceId
                        );
                        const availableZones = selectedService?.zones || [];

                        if (availableZones.length <= 1)
                          return <div className="hidden" />;

                        return (
                          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Коя зона ще се
                                ползва? {isTwoClients ? "(КЛИЕНТ 1)" : ""}
                              </FormLabel>
                              <div className="grid grid-cols-3 gap-2">
                                {availableZones.map((zone) => (
                                  <button
                                    key={zone}
                                    type="button"
                                    onClick={() => field.onChange(zone)}
                                    className={cn(
                                      "h-12 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border-2",
                                      field.value === zone
                                        ? "bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                                    )}
                                  >
                                    {zone}
                                  </button>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>

                            {isTwoClients && (
                              <FormField
                                control={form.control}
                                name="client2Zone"
                                render={({ field: field2 }) => (
                                  <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                      <Activity className="w-3 h-3" /> Коя зона
                                      ще се ползва? (КЛИЕНТ 2)
                                    </FormLabel>
                                    <div className="grid grid-cols-3 gap-2">
                                      {availableZones.map((zone) => (
                                        <button
                                          key={`client2-${zone}`}
                                          type="button"
                                          onClick={() => field2.onChange(zone)}
                                          className={cn(
                                            "h-12 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border-2",
                                            field2.value === zone
                                              ? "bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-600/20"
                                              : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                                          )}
                                        >
                                          {zone}
                                        </button>
                                      ))}
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        );
                      }}
                    />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <DateTimePicker
                      control={form.control}
                      name="startTime"
                      label="Начален час"
                    />
                    <DateTimePicker
                      control={form.control}
                      name="endTime"
                      label="Краен час"
                      disabled={isRecoveryZone}
                    />
                  </div>
                </div>
              )}

              {/* Step 1.5: Package Days */}
              {currentStep === "packageDays" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-2">
                    Избор на следващи дни
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Системата автоматично попълва часовете и зоните за
                    следващите дни от пакета. Можете да ги промените.
                  </p>
                  {packageDays.map((pd, index) => (
                    <div
                      key={index}
                      className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col gap-4"
                    >
                      <div className="text-xs font-black text-cyan-600">
                        ДЕН {pd.dayIndex + 1}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            Начален час
                          </Label>
                          <Input
                            type="datetime-local"
                            className="h-10 text-sm"
                            value={
                              pd.startTime
                                ? new Date(
                                    pd.startTime.getTime() -
                                      pd.startTime.getTimezoneOffset() * 60000
                                  )
                                    .toISOString()
                                    .slice(0, 16)
                                : ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const newDays = [...packageDays];
                              const newStart = new Date(val);
                              newDays[index].startTime = newStart;
                              newDays[index].date = newStart;
                              if (
                                services.find((s) => s.id === serviceId)
                                  ?.durationMinutes
                              ) {
                                const dur = services.find(
                                  (s) => s.id === serviceId
                                )?.durationMinutes;
                                if (dur)
                                  newDays[index].endTime = new Date(
                                    newStart.getTime() + dur * 60000
                                  );
                              }
                              setPackageDays(newDays);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            Краен час
                          </Label>
                          <Input
                            type="datetime-local"
                            className="h-10 text-sm"
                            value={
                              pd.endTime
                                ? new Date(
                                    pd.endTime.getTime() -
                                      pd.endTime.getTimezoneOffset() * 60000
                                  )
                                    .toISOString()
                                    .slice(0, 16)
                                : ""
                            }
                            readOnly
                          />
                        </div>
                      </div>

                      {isRecoveryZone && (
                        <div className="space-y-4 pt-4 border-t border-zinc-200/50">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                              Зона за Клиент 1
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                              {services
                                .find((s) => s.id === serviceId)
                                ?.zones?.map((zone) => (
                                  <button
                                    key={zone}
                                    type="button"
                                    onClick={() => {
                                      const newDays = [...packageDays];
                                      newDays[index].client1Zone = zone;
                                      // Auto-fill down the line
                                      for (
                                        let k = index + 1;
                                        k < newDays.length;
                                        k++
                                      ) {
                                        if (!newDays[k].client1Zone)
                                          newDays[k].client1Zone = zone;
                                      }
                                      setPackageDays(newDays);
                                    }}
                                    className={cn(
                                      "h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                                      pd.client1Zone === zone
                                        ? "bg-cyan-600 border-cyan-600 text-white"
                                        : "bg-white border-zinc-200 text-zinc-500"
                                    )}
                                  >
                                    {zone}
                                  </button>
                                ))}
                            </div>
                          </div>

                          {isTwoClients && (
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                Зона за Клиент 2
                              </Label>
                              <div className="grid grid-cols-3 gap-2">
                                {services
                                  .find((s) => s.id === serviceId)
                                  ?.zones?.map((zone) => (
                                    <button
                                      key={zone}
                                      type="button"
                                      onClick={() => {
                                        const newDays = [...packageDays];
                                        newDays[index].client2Zone = zone;
                                        // Auto-fill down the line
                                        for (
                                          let k = index + 1;
                                          k < newDays.length;
                                          k++
                                        ) {
                                          if (!newDays[k].client2Zone)
                                            newDays[k].client2Zone = zone;
                                        }
                                        setPackageDays(newDays);
                                      }}
                                      className={cn(
                                        "h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                                        pd.client2Zone === zone
                                          ? "bg-cyan-600 border-cyan-600 text-white"
                                          : "bg-white border-zinc-200 text-zinc-500"
                                      )}
                                    >
                                      {zone}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 2: Client Details */}
              {currentStep === "details" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* SEARCH AND SELECT EXISTING MEMBER OR GUEST */}
                  {form.watch("memberId") ? (
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-3xl flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm uppercase">
                          {form.watch("clientName")?.[0]}
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">
                            Свързан профил
                          </p>
                          <h4 className="font-bold text-xs text-zinc-950 dark:text-white leading-none">
                            {form.watch("clientName")}
                          </h4>
                          <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wider font-bold">
                            {form.watch("clientPhone")} •{" "}
                            {form.watch("clientEmail") || "Няма имейл"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.setValue("memberId", undefined);
                          form.setValue("clientName", "");
                          form.setValue("clientPhone", "");
                          form.setValue("clientEmail", "");
                          setSearchTerm("");
                        }}
                        className="h-8 px-3 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[10px] font-black uppercase tracking-wider transition-colors"
                      >
                        Откачи
                      </Button>
                    </div>
                  ) : (
                    <div className="relative space-y-2">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex justify-between items-center">
                        <span>Избор от съществуващи членове или гости</span>
                        {membersLoading && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        )}
                      </FormLabel>
                      <div className="relative">
                        <Input
                          placeholder="Търсене на регистриран член или гост по име..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowMemberDropdown(true);
                          }}
                          onFocus={() => setShowMemberDropdown(true)}
                          className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-xs text-zinc-900"
                        />
                        {showMemberDropdown && searchTerm && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
                            {members
                              .filter((m) =>
                                `${m.firstName} ${m.lastName}`
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase())
                              )
                              .map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    form.setValue(
                                      "clientName",
                                      `${m.firstName} ${m.lastName}`
                                    );
                                    form.setValue("clientPhone", m.phone || "");
                                    form.setValue("clientEmail", m.email || "");
                                    form.setValue("memberId", m.id);
                                    setSearchTerm(
                                      `${m.firstName} ${m.lastName}`
                                    );
                                    setShowMemberDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs flex justify-between items-center transition-colors"
                                >
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                    {m.firstName} {m.lastName}
                                  </span>
                                  <span className="text-[10px] text-zinc-400">
                                    {m.phone || "Няма тел."}{" "}
                                    {m.isGuest ? "• Гост" : "• Член"}
                                  </span>
                                </button>
                              ))}
                            {members.filter((m) =>
                              `${m.firstName} ${m.lastName}`
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                            ).length === 0 && (
                              <div className="p-3 text-center text-zinc-400 text-xs">
                                Няма намерени резултати
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          {isTwoClients ? "Име на Клиент 1" : "Пълно име"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Иван Иванов"
                            className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-bold text-zinc-900"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {isTwoClients ? "Телефон на Клиент 1" : "Телефон"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="0888..."
                              className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-bold text-zinc-900"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            Имейл (опц.)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="email@..."
                              className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-bold text-zinc-900"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {isTwoClients && (
                    <>
                      <FormField
                        control={form.control}
                        name="client2Name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                              Име на Клиент 2{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Петър Петров"
                                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-bold text-zinc-900"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client2Phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                              Телефон на Клиент 2
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="0888..."
                                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 transition-all font-bold text-zinc-900"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === "review" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold">
                          {!isRecoveryZone ? (
                            courtId
                          ) : (
                            <Activity className="w-5 h-5" />
                          )}
                        </div>
                        <div className="max-w-[180px]">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                            {!isRecoveryZone ? "Избран Корт" : "Избрана Услуга"}
                          </p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {!isRecoveryZone
                              ? `Корт № ${courtId}`
                              : services.find((s) => s.id === serviceId)
                                  ?.name || "Услуга"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                          Обща Сума
                        </p>
                        <p className="text-xl font-black text-primary tracking-tight">
                          {formatPrice(price)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3" /> График
                        </p>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {startTime?.toLocaleDateString("bg-BG")}
                          <br />
                          {startTime?.toLocaleTimeString("bg-BG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {endTime?.toLocaleTimeString("bg-BG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <User className="w-3 h-3" /> Клиент
                        </p>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">
                          {clientName}
                          <br />
                          {clientPhone}
                          {clientEmail && (
                            <span className="block opacity-60 text-[10px]">
                              {clientEmail}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {selectedZone && (
                      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Избрана Зона
                        </p>
                        <p className="text-sm font-bold text-cyan-600 uppercase tracking-wider">
                          {selectedZone}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Options */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                          {isEditMode
                            ? "Статус на плащане"
                            : "Плащане при създаване?"}
                        </h4>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-tight font-bold">
                          {isEditMode
                            ? "Промяна на статуса на плащане"
                            : "Маркирайте резервацията като платена веднага"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isPaid = form.getValues("status") === "paid";
                          form.setValue("status", isPaid ? "unpaid" : "paid");
                          if (!isPaid) form.setValue("paymentMethod", "Cash");
                        }}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-all duration-300 relative focus:outline-none",
                          form.watch("status") === "paid"
                            ? "bg-emerald-500"
                            : "bg-zinc-200 dark:bg-zinc-800"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 absolute top-1",
                            form.watch("status") === "paid"
                              ? "left-7"
                              : "left-1"
                          )}
                        />
                      </button>
                    </div>

                    {form.watch("status") === "paid" && (
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 animate-in slide-in-from-top-2 duration-300">
                        <button
                          type="button"
                          onClick={() => form.setValue("paymentMethod", "Cash")}
                          className={cn(
                            "h-12 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2",
                            form.watch("paymentMethod") === "Cash" ||
                              !form.watch("paymentMethod")
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                          )}
                        >
                          В брой
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            form.setValue("paymentMethod", "Revolut")
                          }
                          className={cn(
                            "h-12 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2",
                            form.watch("paymentMethod") === "Revolut"
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                          )}
                        >
                          Revolut
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditMode && reservation?.packageGroupId && (
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/20 mt-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                          Приложи за целия пакет
                        </h4>
                        <p className="text-xs text-zinc-500">
                          Промяната на статуса на плащане ще се отрази на всички
                          резервации от пакета.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setApplyPaymentToPackage(!applyPaymentToPackage)
                        }
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-all duration-300 relative focus:outline-none",
                          applyPaymentToPackage
                            ? "bg-primary"
                            : "bg-zinc-200 dark:bg-zinc-800"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 absolute top-1",
                            applyPaymentToPackage ? "left-7" : "left-1"
                          )}
                        />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 text-amber-700 dark:text-amber-400">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-tight leading-relaxed">
                      Моля, прегледайте данните внимателно преди да финализирате
                      резервацията.
                    </p>
                  </div>
                </div>
              )}

              {/* Wizard Footer */}
              <div className="flex items-center gap-3 pt-4">
                {currentStep !== "time" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="h-14 rounded-2xl px-6 border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px]"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Назад
                  </Button>
                )}

                {currentStep !== "review" ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 h-14 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-black/10"
                  >
                    Продължи <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-primary/20 border-none"
                  >
                    {isSaving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isEditMode ? (
                      "Запази промените"
                    ) : (
                      "Финализирай резервация"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
