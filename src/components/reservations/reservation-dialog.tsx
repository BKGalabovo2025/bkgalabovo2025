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
} from "@/lib/actions/reservations";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { useAppStore } from "@/store/use-app-store";
import { toast } from "sonner";
import { Reservation } from "@/types/reservation";
import { ClubService } from "@/types";
import { getAllClubServices } from "@/services/club-service";
import { cn } from "@/lib/utils";
import { getAllMembers } from "@/services/member-service";
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

const reservationSchema = z
  .object({
    clientName: z
      .string()
      .min(2, { message: "Името трябва да е поне 2 символа." }),
    clientPhone: z.string().min(9, { message: "Невалиден телефонен номер." }),
    clientEmail: z
      .string()
      .email({ message: "Невалиден имейл адрес." })
      .optional()
      .or(z.literal("")),
    courtId: z.number().optional(),
    serviceId: z.string().optional(),
    selectedZone: z.string().optional(),
    startTime: z.date(),
    endTime: z.date(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Крайният час трябва да е след началния.",
    path: ["endTime"],
  });

interface ReservationDialogProps {
  children: React.ReactNode;
  reservation?: Reservation;
  initialData?: Partial<z.infer<typeof reservationSchema>>;
  onSave?: () => void;
}

type Step = "time" | "details" | "review";

export const ReservationDialog: React.FC<ReservationDialogProps> = ({
  children,
  reservation,
  initialData,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("time");
  const [services, setServices] = useState<ClubService[]>([]);
  const { activeBranch } = useAppStore();
  const isRecoveryZone = activeBranch === "recoveryzone";

  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

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
      getAllClubServices().then((data: ClubService[]) => {
        setServices(data.filter((s: ClubService) => s.requiresBooking));
      });
    }
  }, [isRecoveryZone]);

  const { getFreshToken } = useAuth();

  const COURT_PRICE_PER_HOUR = 10;
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
  } = watchedValues;

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
      return durationHours * COURT_PRICE_PER_HOUR;
    }
    return 0;
  }, [startTime, endTime, serviceId, isRecoveryZone, services]);

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

  const handleNext = async () => {
    if (currentStep === "time") {
      const fieldsToTrigger: Array<keyof z.infer<typeof reservationSchema>> = [
        "startTime",
        "endTime",
      ];
      if (!isRecoveryZone) fieldsToTrigger.push("courtId");
      else {
        fieldsToTrigger.push("serviceId");
        const selectedService = services.find((s) => s.id === serviceId);
        if (selectedService && (selectedService.zones?.length || 0) > 1) {
          fieldsToTrigger.push("selectedZone");
        }
      }

      const isValid = await trigger(fieldsToTrigger);
      if (isValid) setCurrentStep("details");
    } else if (currentStep === "details") {
      const isValid = await trigger([
        "clientName",
        "clientPhone",
        "clientEmail",
      ]);
      if (isValid) setCurrentStep("review");
    }
  };

  const handleBack = () => {
    if (currentStep === "details") setCurrentStep("time");
    else if (currentStep === "review") setCurrentStep("details");
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
      let finalResources = selectedService?.requiredResources;
      if (values.selectedZone && finalResources) {
        // If a specific zone is chosen, we narrow down the resources to just that zone + 1 compressor
        const zone = values.selectedZone;
        finalResources = {
          compressors: 1,
          attachments: {
            legs: zone === "Крака" ? 1 : 0,
            arms: zone === "Ръце" ? 1 : 0,
            hips: zone === "Таз" ? 1 : 0,
          },
        };
      }

      const dataToSave = {
        ...values,
        siteId: activeBranch,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        totalPrice: price,
        price: price,
        finalPrice: price,
        currency: "EUR",
        serviceName: selectedService?.name,
        usedResources: finalResources,
        selectedZone: values.selectedZone,
        isExclusive: selectedService?.isExclusive,
        bufferAfter: selectedService?.bufferAfter,
      };

      let result;
      if (isEditMode) {
        result = await updateReservationAction(
          token,
          reservation.id,
          dataToSave
        );
      } else {
        result = await createReservationAction(token, {
          ...dataToSave,
          status: "unpaid",
        });
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <FormItem className="animate-in slide-in-from-top-2 duration-300">
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                              <Activity className="w-3 h-3" /> Коя зона ще се
                              ползва?
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

              {/* Step 2: Client Details */}
              {currentStep === "details" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* SEARCH AND SELECT EXISTING MEMBER OR GUEST */}
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
                                  setSearchTerm(`${m.firstName} ${m.lastName}`);
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

                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          Пълно име
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
                            Телефон
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
