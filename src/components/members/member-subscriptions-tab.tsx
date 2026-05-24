"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useSales } from "@/hooks/useSales";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  getSubscriptionsByMemberId,
  getAllClubServices,
} from "@/services/subscription-service";
import {
  createSubscriptionAction,
  deleteSubscriptionAction,
} from "@/lib/actions/subscriptions";
import { findOrCreateSaleForSubscriptionAction } from "@/lib/actions/sales";
import { Subscription, ClubService, Member } from "@/types";
import { useAuth } from "@/context/auth-context";
import {
  PlusCircle,
  Loader2,
  CalendarIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  Trash2,
  Sparkles,
  Wallet,
  Package,
  ArrowRight,
  Check,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { formatPrice } from "@/lib/currency";
import { MembershipSuggestions } from "@/components/subscriptions/MembershipSuggestions";
import { RegisterPaymentDialog } from "@/components/subscriptions/register-payment-dialog";

// Helper functions for date calculations
const calculateEndDate = (
  startDate: Date,
  billingPeriod: ClubService["billingPeriod"]
): Date => {
  const endDate = new Date(startDate);
  if (billingPeriod === "Месечен") {
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(endDate.getDate() - 1);
  } else if (billingPeriod === "Годишен") {
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setDate(endDate.getDate() - 1);
  }
  return endDate;
};

// --- DIALOG FOR ADDING A NEW SUBSCRIPTION (REFACTORED AS GUIDED WIZARD) ---
export const AddSubscriptionDialog = ({
  memberId,
  services,
  onSubscriptionAdded,
  user,
  idToken,
  initialSelection,
  onClearSelection,
  externalOpen,
  onExternalOpenChange,
}: {
  memberId: string;
  services: ClubService[];
  onSubscriptionAdded: () => void;
  user: User | null;
  idToken: string | null;
  initialSelection?: {
    serviceId: string;
    price: number;
    suggestedName?: string;
    month?: string;
  } | null;
  onClearSelection?: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen ?? internalOpen;
  const setIsOpen = onExternalOpenChange ?? setInternalOpen;

  // Wizard states
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [billingType, setBillingType] = useState<
    "subscription" | "single" | "other"
  >("subscription");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );

  // Details states
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [customServiceName, setCustomServiceName] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [paymentStatus, setPaymentStatus] = useState<"completed" | "pending">(
    "completed"
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialSelection) {
      const s = services.find((srv) => srv.id === initialSelection.serviceId);
      if (s) {
        if (s.type === "Абонамент") setBillingType("subscription");
        else setBillingType("single");
      }
      setSelectedServiceId(initialSelection.serviceId);
      setCustomPrice(initialSelection.price);
      setCustomServiceName(initialSelection.suggestedName || "");
      if (initialSelection.month) {
        const [y, m] = initialSelection.month.split("-").map(Number);
        setStartDate(new Date(y, m - 1, 1));
      }
      setPaymentStatus("pending");
      setStep(3); // Jump straight to details for smart suggestions
      if (onExternalOpenChange) onExternalOpenChange(true);
      else setInternalOpen(true);
    }
  }, [initialSelection, services, onExternalOpenChange]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onClearSelection) {
      onClearSelection();
    }
    if (!open) {
      setStep(1);
      setBillingType("subscription");
      setSelectedServiceId(null);
      setCustomPrice(null);
      setCustomServiceName("");
      setStartDate(new Date());
      setPaymentStatus("completed");
    }
  };

  const handleChooseType = (type: "subscription" | "single" | "other") => {
    setBillingType(type);
    setSelectedServiceId(null);
    setStep(2);
  };

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    const s = services.find((srv) => srv.id === id);
    if (s) {
      setCustomPrice(s.price);
      setCustomServiceName(s.name);
    }
    setStep(3);
  };

  const handleSelectCustomManual = () => {
    setSelectedServiceId("custom_manual");
    setCustomPrice(10);
    setCustomServiceName(
      billingType === "other"
        ? "Наплитане на ракета"
        : "Индивидуална тренировка"
    );
    setStep(3);
  };

  const handleNextToStatus = () => {
    if (!customServiceName.trim()) {
      toast.error("Грешка", { description: "Моля, въведете име на услугата." });
      return;
    }
    if (customPrice === null || customPrice < 0) {
      toast.error("Грешка", { description: "Моля, въведете валидна цена." });
      return;
    }
    setStep(4);
  };

  const handleAddSubscription = async () => {
    if (!user) {
      toast.error("Грешка", {
        description: "Трябва да сте влезли, за да добавите абонамент.",
      });
      return;
    }

    if (!selectedServiceId || !startDate) {
      toast.error("Грешка", {
        description: "Моля, изберете услуга и начална дата.",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!idToken) {
        toast.error("Грешка", { description: "Липсва токен за оторизация." });
        return;
      }

      let endDate = startDate;
      let serviceId = selectedServiceId;

      if (selectedServiceId === "custom_manual") {
        serviceId = "custom_pos_service";
        if (billingType === "subscription") {
          endDate = calculateEndDate(startDate, "Месечен");
        }
      } else {
        const service = services.find((s) => s.id === selectedServiceId);
        if (service) {
          endDate = calculateEndDate(startDate, service.billingPeriod);
        }
      }

      if (initialSelection?.month) {
        const [y, m] = initialSelection.month.split("-").map(Number);
        const lastDay = new Date(y, m, 0);
        lastDay.setHours(23, 59, 59, 999);
        endDate = lastDay;
      }

      const finalPrice = customPrice ?? 0;
      const finalServiceName = customServiceName || "Клубна услуга";

      const isPaid = paymentStatus === "completed";
      const subPrice = finalPrice;
      const subPricePaid = isPaid ? subPrice : 0;
      const subStatus = isPaid ? "active" : "pending_payment";

      const result = await createSubscriptionAction(idToken, {
        memberId: memberId,
        serviceId: serviceId,
        serviceName: finalServiceName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: subStatus,
        pricePaid: subPricePaid,
        price: subPrice,
        currency: "EUR",
        paymentHistory: isPaid
          ? [
              {
                date: new Date().toISOString(),
                amount: subPrice,
                paymentId: `pay_${Date.now()}`,
                paymentMethod: "cash",
                note: "Ръчно добавена продажба чрез POS Wizard",
              },
            ]
          : [],
        paymentsMadeCount: isPaid ? 1 : 0,
        totalPaymentsCount: 1,
      });

      if (result.success) {
        toast.success("Успех!", {
          description: isPaid
            ? "Услугата/абонаментът е добавен и маркиран като платен."
            : "Абонаментът е добавен и очаква плащане.",
        });
        onSubscriptionAdded();
        handleOpenChange(false);
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error("Грешка", {
        description: "Възникна проблем при създаването.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscriptionType = billingType === "subscription";

  // Filter services matching the current wizard type
  const filteredCatalog = services.filter((s) => {
    if (billingType === "subscription") {
      return s.type === "Абонамент" && s.billingPeriod !== null;
    } else if (billingType === "single") {
      const name = s.name.toLowerCase();
      return (
        (s.type === "Еднократно плащане" || s.billingPeriod === null) &&
        !name.includes("наплитане") &&
        !name.includes("кордаж")
      );
    } else {
      const name = s.name.toLowerCase();
      return name.includes("наплитане") || name.includes("кордаж");
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 px-6 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-medium uppercase tracking-widest2 shadow-none flex items-center gap-2">
          <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
          Каталог Тренировки / Услуги
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-4xl border-zinc-100 shadow-none max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-light tracking-tight text-zinc-950">
            Добавяне на такса / услуга
          </DialogTitle>
          <DialogDescription className="text-xs font-light text-zinc-400">
            Guided Step-by-Step POS Помощник
          </DialogDescription>
        </DialogHeader>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-2xl border border-zinc-100/80 mb-6 overflow-x-auto no-scrollbar">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={`step-dot-${s}`} className="flex items-center">
              <span
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold transition-all",
                  step === s
                    ? "bg-zinc-950 text-white"
                    : step > s
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-zinc-100 text-zinc-400"
                )}
              >
                {step > s ? <Check className="h-3 w-3" /> : s}
              </span>
              {s < 5 && (
                <div
                  className={cn(
                    "w-6 sm:w-10 h-0.5 mx-1",
                    step > s ? "bg-emerald-100" : "bg-zinc-100"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: CHOOSE BILLING TYPE */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400 mb-2">
              Стъпка 1: Изберете тип такса
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => handleChooseType("subscription")}
                className="flex items-center gap-4 p-5 rounded-3xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-200 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-zinc-100/50 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-zinc-950">
                    Абонамент (Членство)
                  </h4>
                  <p className="text-xs font-light text-zinc-400 mt-1">
                    Месечни или годишни клубни карти за редовни тренировки.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChooseType("single")}
                className="flex items-center gap-4 p-5 rounded-3xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-200 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-zinc-100/50 group-hover:scale-105 transition-transform">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-zinc-950">
                    Индивидуална / Еднократна тренировка
                  </h4>
                  <p className="text-xs font-light text-zinc-400 mt-1">
                    Еднократно посещение или заплащане на брой тренировки.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChooseType("other")}
                className="flex items-center gap-4 p-5 rounded-3xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-200 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-zinc-100/50 group-hover:scale-105 transition-transform">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-zinc-950">
                    Наплитане на ракета / Друго
                  </h4>
                  <p className="text-xs font-light text-zinc-400 mt-1">
                    Кордажи, наплитане на ракети или други допълнителни клубни
                    услуги.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT FROM CATALOG */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
                Стъпка 2: Изберете пакет
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="h-8 text-zinc-500 text-[10px] uppercase font-bold"
              >
                Назад
              </Button>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredCatalog.length === 0 ? (
                <div className="py-10 text-center bg-zinc-50/50 border border-dashed rounded-3xl border-zinc-100">
                  <p className="text-xs font-light text-zinc-400">
                    Няма намерени услуги в тази категория.
                  </p>
                </div>
              ) : (
                filteredCatalog.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleSelectService(service.id)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300 transition-all text-left"
                  >
                    <div>
                      <h5 className="font-medium text-sm text-zinc-950">
                        {service.name}
                      </h5>
                      <span className="text-[9px] uppercase tracking-widest bg-zinc-100/50 text-zinc-600 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                        {service.billingPeriod || service.type || "Еднократно"}
                      </span>
                    </div>
                    <span className="font-semibold text-sm text-zinc-900 pr-1">
                      {formatPrice(service.price)}
                    </span>
                  </button>
                ))
              )}

              {/* Custom manual charge fallback */}
              <button
                type="button"
                onClick={handleSelectCustomManual}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-dashed border-zinc-200 bg-white hover:bg-zinc-50 transition-all text-left text-zinc-600"
              >
                <div>
                  <h5 className="font-medium text-sm">
                    Свободно ръчно въвеждане...
                  </h5>
                  <p className="text-[10px] font-light text-zinc-400 mt-0.5">
                    Въведете собствено заглавие и цена
                  </p>
                </div>
                <PlusCircle className="h-5 w-5 text-zinc-300 pr-1" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SETUP DETAILS */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
                Стъпка 3: Настройка на детайли
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(initialSelection ? 3 : 2)}
                disabled={!!initialSelection}
                className="h-8 text-zinc-500 text-[10px] uppercase font-bold"
              >
                Назад
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
                  Име на услугата / таксата
                </label>
                <Input
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                  placeholder="Въведете име..."
                  className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 text-sm font-light text-zinc-950"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
                  Цена (EUR)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={customPrice ?? ""}
                  onChange={(e) =>
                    setCustomPrice(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 text-sm font-light text-zinc-950"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
                  {isSubscriptionType ? "Начална дата" : "Дата на транзакцията"}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-start text-left font-light rounded-2xl border-zinc-100 bg-zinc-50/50 text-zinc-950"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
                      {startDate ? (
                        format(startDate, "PPP", { locale: bg })
                      ) : (
                        <span>Изберете дата</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 rounded-2xl border-zinc-100 shadow-none"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-50">
              <Button
                onClick={handleNextToStatus}
                className="h-12 w-full rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-widest2 flex items-center justify-center gap-2"
              >
                Продължи
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 4: PAYMENT STATUS */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
                Стъпка 4: Статус на плащане
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(3)}
                className="h-8 text-zinc-500 text-[10px] uppercase font-bold"
              >
                Назад
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus("completed");
                  setStep(5);
                }}
                className={cn(
                  "flex items-center gap-4 p-5 rounded-3xl border transition-all text-left",
                  paymentStatus === "completed"
                    ? "border-emerald-500 bg-emerald-50/40 text-emerald-950 font-semibold"
                    : "border-zinc-100 bg-zinc-50/50 text-zinc-500 hover:bg-zinc-100"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                    paymentStatus === "completed"
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-zinc-400"
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Платено сега в брой</h4>
                  <p className="text-[11px] font-light text-zinc-400 mt-0.5">
                    Маркирай като платено в брой веднага.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentStatus("pending");
                  setStep(5);
                }}
                className={cn(
                  "flex items-center gap-4 p-5 rounded-3xl border transition-all text-left",
                  paymentStatus === "pending"
                    ? "border-rose-500 bg-rose-50/40 text-rose-950 font-semibold"
                    : "border-zinc-100 bg-zinc-50/50 text-zinc-500 hover:bg-zinc-100"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                    paymentStatus === "pending"
                      ? "bg-rose-500 text-white"
                      : "bg-white text-zinc-400"
                  )}
                >
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">
                    Запиши като дълг (Плати по-късно)
                  </h4>
                  <p className="text-[11px] font-light text-zinc-400 mt-0.5">
                    Служителят ще регистрира плащането по-късно.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PREVIEW & CONFIRMATION */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
                Стъпка 5: Преглед и потвърждение
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(4)}
                className="h-8 text-zinc-500 text-[10px] uppercase font-bold"
              >
                Назад
              </Button>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50">
                <span className="text-xs text-zinc-400 uppercase tracking-widest">
                  Услуга / Такса
                </span>
                <span className="text-sm font-medium text-zinc-950">
                  {customServiceName}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-400 uppercase tracking-widest">
                  Цена
                </span>
                <span className="text-base font-semibold text-zinc-900">
                  {formatPrice(customPrice || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-400 uppercase tracking-widest">
                  Дата
                </span>
                <span className="text-xs font-light text-zinc-650">
                  {startDate ? format(startDate, "dd.MM.yyyy") : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-200/50">
                <span className="text-xs text-zinc-400 uppercase tracking-widest">
                  Статус
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase font-semibold tracking-widest bg-white border px-3 py-1 rounded-full",
                    paymentStatus === "completed"
                      ? "border-emerald-200 text-emerald-700 bg-emerald-50/20"
                      : "border-rose-200 text-rose-700 bg-rose-50/20"
                  )}
                >
                  {paymentStatus === "completed" ? "Платено" : "Чака плащане"}
                </span>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-50">
              <Button
                onClick={handleAddSubscription}
                disabled={isLoading}
                className="h-12 w-full rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-widest2 flex items-center justify-center gap-2 shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    Потвърди и Запиши
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// --- SUBSCRIPTION CARD ---
const ReceiptButton = ({
  subscription,
  onUpdate,
}: {
  subscription: Subscription;
  onUpdate: () => void;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { idToken } = useAuth();

  const handleReceiptClick = async () => {
    setIsLoading(true);
    try {
      if (!idToken) {
        toast.error("Липсва оторизация. Моля, влезте отново.");
        return;
      }
      const result = await findOrCreateSaleForSubscriptionAction(
        idToken,
        subscription
      );
      const data = result.data as { id: string } | undefined;
      if (result.success && data?.id) {
        onUpdate();
        router.push(`/sales/${data.id}/receipt`);
      } else {
        toast.error("Грешка", {
          description:
            result.message || "Не може да бъде генерирана квитанция.",
        });
      }
    } catch {
      toast.error("Грешка", {
        description: "Възникна проблем при генерирането на квитанцията.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleReceiptClick}
      disabled={isLoading}
      className="h-10 px-4 rounded-xl border-zinc-100 hover:bg-zinc-50 font-medium text-[10px] uppercase tracking-widest2"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Receipt className="mr-2 h-3.5 w-3.5" />
      )}
      Квитанция
    </Button>
  );
};

const SubscriptionCard = ({
  sub,
  service,
  onSubscriptionUpdate,
  idToken,
  familyMembers,
  currentMemberId,
}: {
  sub: Subscription;
  service?: ClubService;
  onSubscriptionUpdate: () => void;
  user: User | null;
  idToken: string | null;
  familyMembers?: Member[];
  currentMemberId?: string;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const handleRenew = async () => {
    if (!idToken) {
      toast.error("Не сте оторизиран.");
      return;
    }

    setIsRenewing(true);
    try {
      const now = new Date();
      const currentEndDate = new Date(sub.endDate);

      let nextStartDate = new Date(
        currentEndDate.getTime() + 24 * 60 * 60 * 1000
      );
      if (nextStartDate < now) {
        nextStartDate = now;
      }
      nextStartDate.setHours(0, 0, 0, 0);

      const serviceBillingPeriod = service?.billingPeriod || "Месечен";
      const nextEndDate = calculateEndDate(nextStartDate, serviceBillingPeriod);

      const result = await createSubscriptionAction(idToken, {
        memberId: sub.memberId,
        serviceId: sub.serviceId,
        serviceName: sub.serviceName,
        startDate: nextStartDate.toISOString(),
        endDate: nextEndDate.toISOString(),
        price: sub.price,
        pricePaid: 0,
        status: "pending_payment",
        paymentHistory: [],
        paymentsMadeCount: 0,
      });

      if (result.success) {
        toast.success("Абонаментът е подновен успешно като Чакащо плащане!");
        onSubscriptionUpdate();
      } else {
        toast.error("Грешка при подновяване", { description: result.message });
      }
    } catch (error) {
      console.error("Error renewing subscription:", error);
      toast.error("Възникна грешка при подновяването.");
    } finally {
      setIsRenewing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този абонамент?"))
      return;

    setIsDeleting(true);
    try {
      if (!idToken) {
        toast.error("Липсва оторизация.");
        return;
      }
      const result = await deleteSubscriptionAction(idToken, sub.id);
      if (result.success) {
        toast.success(result.message);
        onSubscriptionUpdate();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Грешка при изтриването");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusInfo = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endDate = new Date(sub.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (sub.status !== "cancelled" && now > endDate) {
      return {
        icon: <XCircle className="h-4 w-4 text-rose-500" />,
        text: "Изтекъл",
        color: "border-rose-500",
        bgColor: "bg-rose-50/10",
      };
    }
    switch (sub.status) {
      case "active":
        return {
          icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
          text: "Активен",
          color: "border-emerald-500",
          bgColor: "bg-emerald-50/10",
        };
      case "pending_payment":
        return {
          icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
          text: "Чакащо плащане",
          color: "border-amber-500",
          bgColor: "bg-amber-50/20",
        };
      case "cancelled":
        return {
          icon: <XCircle className="h-4 w-4 text-zinc-400" />,
          text: "Отменен",
          color: "border-zinc-200",
          bgColor: "bg-zinc-50/10",
        };
      default:
        return {
          icon: <XCircle className="h-4 w-4 text-zinc-400" />,
          text: "Неактивен",
          color: "border-zinc-200",
          bgColor: "bg-zinc-50/10",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const isPaid = sub.pricePaid > 0;

  return (
    <div
      className={cn(
        "border border-zinc-100 rounded-3xl p-5 sm:p-6 mb-4 bg-white hover:bg-zinc-50/50 transition-all shadow-sm relative overflow-hidden",
        sub.status === "pending_payment" && "border-rose-100 bg-rose-50/5"
      )}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h4 className="font-medium text-lg sm:text-xl tracking-tight text-zinc-950">
            {sub.serviceName}
          </h4>
          {currentMemberId &&
            sub.memberId !== currentMemberId &&
            familyMembers && (
              <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider block mt-1">
                За член на семейството:{" "}
                {familyMembers.find((m) => m.id === sub.memberId)?.firstName ||
                  "Член"}
              </span>
            )}
        </div>
        <div
          className={cn(
            "flex items-center space-x-2 px-3 py-1 rounded-full border text-[9px] uppercase font-bold tracking-wider bg-white shadow-none shrink-0",
            sub.status === "pending_payment"
              ? "text-rose-600 border-rose-100"
              : "text-zinc-600 border-zinc-100"
          )}
        >
          {statusInfo.icon}
          <span>{statusInfo.text}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 items-end">
        <div className="space-y-1">
          <p className="text-[9px] font-medium uppercase tracking-widest text-zinc-400">
            Начало
          </p>
          <div className="flex items-center gap-1.5 text-xs font-light text-zinc-900">
            <CalendarIcon
              className="h-3.5 w-3.5 text-zinc-300"
              strokeWidth={1.5}
            />{" "}
            {new Date(sub.startDate).toLocaleDateString("bg-BG")}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-medium uppercase tracking-widest text-zinc-400">
            Край
          </p>
          <div className="flex items-center gap-1.5 text-xs font-light text-zinc-900">
            <CalendarIcon
              className="h-3.5 w-3.5 text-zinc-300"
              strokeWidth={1.5}
            />
            {new Date(sub.endDate).toLocaleDateString("bg-BG")}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-medium uppercase tracking-widest text-zinc-400">
            Платено
          </p>
          <div className="text-sm font-semibold text-zinc-950">
            {formatPrice(sub.pricePaid)}
          </div>
        </div>
        <div className="flex flex-wrap justify-start lg:justify-end items-center gap-2 col-span-2 lg:col-span-1 pt-4 sm:pt-0 border-t border-zinc-100 sm:border-t-0">
          {statusInfo.text === "Изтекъл" && (
            <Button
              size="sm"
              onClick={handleRenew}
              disabled={isRenewing}
              className="h-9 px-4 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[10px] uppercase tracking-widest2 shadow-none flex items-center gap-2"
            >
              {isRenewing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <PlusCircle className="h-3.5 w-3.5" />
                  Поднови
                </>
              )}
            </Button>
          )}
          {isPaid && (
            <ReceiptButton subscription={sub} onUpdate={onSubscriptionUpdate} />
          )}
          {sub.status === "pending_payment" && (
            <RegisterPaymentDialog
              sub={sub}
              onPaymentSuccess={onSubscriptionUpdate}
              idToken={idToken}
            />
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-10 w-10 p-0 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN TAB COMPONENT ---
export const MemberSubscriptionsTab = ({
  memberId,
  member,
  memberIds,
  familyMembers,
}: {
  memberId: string;
  member?: Member;
  memberIds?: string[];
  familyMembers?: Member[];
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [allServices, setAllServices] = useState<ClubService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const { user, idToken } = useAuth();
  const { sales, markAsPaid, deleteSale } = useSales(memberIds || memberId);

  const pendingSales = sales.filter(
    (sale) => sale.status === "pending" || sale.isPaid === false
  );

  const [selectedSmartSuggestion, setSelectedSmartSuggestion] = useState<{
    serviceId: string;
    price: number;
    suggestedName?: string;
    month?: string;
  } | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const refreshData = () => setRefreshCount((count) => count + 1);

  const memberIdsKey = memberIds ? memberIds.join(",") : "";

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const targetIds = memberIdsKey ? memberIdsKey.split(",") : [memberId];
        const [srvs, ...subsResults] = await Promise.all([
          getAllClubServices(),
          ...targetIds.map((id) => getSubscriptionsByMemberId(id)),
        ]);
        const subs = subsResults.flat();
        if (isMounted) {
          subs.sort(
            (a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          setSubscriptions(subs);
          setAllServices(srvs);
        }
      } catch {
        if (isMounted) {
          toast.error("Грешка", {
            description: "Неуспешно зареждане на данните.",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [memberId, refreshCount, memberIdsKey]);

  const handleSelectSmartService = (
    serviceId: string,
    price: number,
    suggestedName?: string,
    month?: string
  ) => {
    setSelectedSmartSuggestion({ serviceId, price, suggestedName, month });
    setIsAddDialogOpen(true);
  };

  const pendingSubs = subscriptions.filter(
    (sub) => sub.status === "pending_payment"
  );
  const historySubs = subscriptions.filter(
    (sub) => sub.status !== "pending_payment"
  );

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2
          className="h-8 w-8 animate-spin text-zinc-200"
          strokeWidth={1.5}
        />
      </div>
    );

  return (
    <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl p-4 sm:p-8 lg:p-10 shadow-sm animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 sm:mb-12">
        <div>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tighter text-zinc-950 mb-2">
            Услуги & Членство
          </h2>
          <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
            Каталог на предлаганите абонаменти, еднократни и индивидуални
            тренировки.
          </p>
        </div>
        <AddSubscriptionDialog
          memberId={memberId}
          services={allServices}
          onSubscriptionAdded={refreshData}
          user={user}
          idToken={idToken}
          initialSelection={selectedSmartSuggestion}
          onClearSelection={() => setSelectedSmartSuggestion(null)}
          externalOpen={isAddDialogOpen}
          onExternalOpenChange={setIsAddDialogOpen}
        />
      </div>

      {member && (
        <div className="mb-10 bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
          <MembershipSuggestions
            member={member}
            services={allServices}
            memberSubscriptions={subscriptions}
            onSelectService={handleSelectSmartService}
          />
        </div>
      )}

      {/* SECTION 1: PENDING DUES (Секция: Чакащи плащания) */}
      <div>
        <h3 className="text-[11px] font-medium uppercase tracking-widest3 text-zinc-400 mb-6 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
          Чакащи задължения (Дългове)
        </h3>

        {pendingSubs.length === 0 && pendingSales.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50/30 border border-zinc-100 border-dashed rounded-3xl">
            <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-300">
              Няма чакащи задължения.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unpaid sales rendering */}
            {pendingSales.map((sale) => (
              <div
                key={`sale-${sale.id}`}
                className="bg-white border border-rose-100 rounded-3xl p-6 shadow-sm shadow-rose-900/5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 rounded-l-3xl"></div>
                <div className="flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">
                      {sale.items
                        .map(
                          (i: any) =>
                            `${i.name}${i.quantity > 1 ? ` (x${i.quantity})` : ""}`
                        )
                        .join(", ")}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-medium text-zinc-400">
                      <span className="text-rose-500 uppercase tracking-widest2">
                        Чакащо плащане
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(sale.saleDate).toLocaleDateString("bg-BG")}
                      </span>
                      {sale.memberId !== memberId && familyMembers && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600">
                            За:{" "}
                            {familyMembers.find((m) => m.id === sale.memberId)
                              ?.firstName || "Семейство"}{" "}
                            {familyMembers.find((m) => m.id === sale.memberId)
                              ?.lastName || ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-medium tracking-widest text-zinc-400">
                        Сума
                      </p>
                      <p className="text-lg font-bold text-zinc-900">
                        {formatPrice(sale.totalAmount)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => deleteSale(sale.id, sale.subscriptionId)}
                        variant="outline"
                        className="border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl"
                      >
                        Изтрий
                      </Button>
                      <Button
                        onClick={() => markAsPaid(sale.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20"
                      >
                        Плати сега
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Unpaid subscriptions rendering */}
            {pendingSubs.map((sub) => (
              <SubscriptionCard
                key={`sub-pending-${sub.id}`}
                sub={sub}
                service={allServices.find((s) => s.id === sub.serviceId)}
                onSubscriptionUpdate={refreshData}
                user={user}
                idToken={idToken}
                familyMembers={familyMembers}
                currentMemberId={memberId}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: ACTIVE & HISTORICAL MEMBER SUBSCRIPTIONS */}
      <div className="mt-12 pt-10 border-t border-zinc-100">
        <h3 className="text-[11px] font-medium uppercase tracking-widest3 text-zinc-400 mb-6 flex items-center gap-3">
          <History className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
          Активни и минали абонаменти
        </h3>

        {historySubs.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50/10 border border-zinc-100 border-dashed rounded-3xl">
            <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-300">
              Няма активни или изтекли абонаменти.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {historySubs.map((sub) => (
              <SubscriptionCard
                key={`sub-history-${sub.id}`}
                sub={sub}
                service={allServices.find((s) => s.id === sub.serviceId)}
                onSubscriptionUpdate={refreshData}
                user={user}
                idToken={idToken}
                familyMembers={familyMembers}
                currentMemberId={memberId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
