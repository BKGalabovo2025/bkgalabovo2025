/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  updateSubscriptionAction,
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
  CreditCard,
  Banknote,
  Check,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { formatPrice } from "@/lib/currency";
import { MembershipSuggestions } from "@/components/subscriptions/MembershipSuggestions";

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

// --- DIALOG FOR ADDING A NEW SUBSCRIPTION ---
const AddSubscriptionDialog = ({
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

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [customServiceName, setCustomServiceName] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialSelection) {
      setSelectedServiceId(initialSelection.serviceId);
      setCustomPrice(initialSelection.price);
      setCustomServiceName(initialSelection.suggestedName || "");
      if (initialSelection.month) {
        const [y, m] = initialSelection.month.split("-").map(Number);
        setStartDate(new Date(y, m - 1, 1));
      }
      if (onExternalOpenChange) onExternalOpenChange(true);
      else setInternalOpen(true);
    }
  }, [initialSelection, onExternalOpenChange]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onClearSelection) {
      onClearSelection();
    }
    if (!open) {
      setSelectedServiceId(null);
      setCustomPrice(null);
      setCustomServiceName("");
      setStartDate(new Date());
    }
  };

  const handleServiceChange = (id: string) => {
    setSelectedServiceId(id);
    const s = services.find((srv) => srv.id === id);
    if (s) {
      setCustomPrice(s.price);
      setCustomServiceName(s.name);
    }
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

    const service = services.find((s) => s.id === selectedServiceId);
    if (!service) {
      toast.error("Грешка", { description: "Избраната услуга не е валидна." });
      return;
    }

    setIsLoading(true);
    try {
      if (!idToken) {
        toast.error("Грешка", { description: "Липсва токен за оторизация." });
        return;
      }

      let endDate = calculateEndDate(startDate, service.billingPeriod);
      if (initialSelection?.month) {
        const [y, m] = initialSelection.month.split("-").map(Number);
        const lastDay = new Date(y, m, 0);
        lastDay.setHours(23, 59, 59, 999);
        endDate = lastDay;
      }

      const finalPrice = customPrice ?? service.price;
      const finalServiceName = customServiceName || service.name;

      const result = await createSubscriptionAction(idToken, {
        memberId: memberId,
        serviceId: service.id,
        serviceName: finalServiceName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: "pending_payment", // New subscriptions require payment
        pricePaid: 0,
        price: finalPrice,
        currency: "EUR", // ALWAYS set new subscriptions to EUR
        paymentHistory: [],
        paymentsMadeCount: 0,
        totalPaymentsCount: 1, // Or based on service type
      });

      if (result.success) {
        toast.success("Успех!", {
          description: "Абонаментът е добавен и очаква плащане.",
        });
        onSubscriptionAdded();
        handleOpenChange(false);
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error("Грешка", {
        description: "Възникна проблем при създаването на абонамента.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 px-6 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-medium uppercase tracking-widest2 shadow-none flex items-center gap-2">
          <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
          Каталог Тренировки / Услуги
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-4xl border-zinc-100 shadow-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-light tracking-tight">
            Каталог Услуги
          </DialogTitle>
          <DialogDescription className="text-sm font-light text-zinc-400">
            Каталог на предлаганите абонаменти, еднократни и индивидуални
            тренировки.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="space-y-2">
            <label
              htmlFor="service"
              className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400"
            >
              Услуга
            </label>
            <Select
              onValueChange={handleServiceChange}
              value={selectedServiceId || undefined}
            >
              <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50">
                <SelectValue placeholder="Изберете услуга от каталога..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-none">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({formatPrice(service.price)}){" "}
                    {service.type ? `[${service.type}]` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedServiceId && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
                  Име на абонамент
                </label>
                <Input
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                  placeholder="Име на абонамента..."
                  className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
                  Цена ({selectedService?.currency || "EUR"})
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={customPrice ?? ""}
                  onChange={(e) =>
                    setCustomPrice(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label
              htmlFor="start-date"
              className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400"
            >
              Начална дата
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full h-12 justify-start text-left font-light rounded-xl border-zinc-100 bg-zinc-50/50",
                    !startDate && "text-muted-foreground"
                  )}
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
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="h-11 rounded-xl border-zinc-100 font-medium text-[11px] uppercase tracking-widest2"
          >
            Отказ
          </Button>
          <Button
            onClick={handleAddSubscription}
            disabled={isLoading}
            className="h-11 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[11px] uppercase tracking-widest2 shadow-none"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Запази"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- EXISTING COMPONENTS (with minor adjustments if needed) ---

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
  onSubscriptionUpdate,
  idToken,
}: {
  sub: Subscription;
  service?: ClubService;
  onSubscriptionUpdate: () => void;
  user: User | null;
  idToken: string | null;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

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
        bgColor: "bg-rose-50/30",
      };
    }
    switch (sub.status) {
      case "active":
        return {
          icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
          text: "Активен",
          color: "border-emerald-500",
          bgColor: "bg-emerald-50/30",
        };
      case "pending_payment":
        return {
          icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
          text: "Чакащо плащане",
          color: "border-amber-500",
          bgColor: "bg-amber-50/30",
        };
      case "cancelled":
        return {
          icon: <XCircle className="h-4 w-4 text-zinc-400" />,
          text: "Отменен",
          color: "border-zinc-200",
          bgColor: "bg-zinc-50/30",
        };
      default:
        return {
          icon: <XCircle className="h-4 w-4 text-zinc-400" />,
          text: "Неактивен",
          color: "border-zinc-200",
          bgColor: "bg-zinc-50/30",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const isPaid = sub.pricePaid > 0;

  return (
    <div
      className={`border border-zinc-100 rounded-3xl sm:rounded-4xl p-5 sm:p-8 mb-4 sm:mb-6 ${statusInfo.bgColor} transition-all hover:bg-zinc-50/50`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <h4 className="font-light text-xl sm:text-2xl tracking-tight text-zinc-950">
          {sub.serviceName}
        </h4>
        <div className="flex items-center space-x-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-zinc-100 bg-white shrink-0">
          {statusInfo.icon}
          <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest2 text-zinc-950">
            {statusInfo.text}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8 mt-6 sm:mt-8 items-end">
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-zinc-400">
            Начало
          </p>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-sm font-light text-zinc-900">
            <CalendarIcon
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-300"
              strokeWidth={1.5}
            />{" "}
            {new Date(sub.startDate).toLocaleDateString("bg-BG")}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-zinc-400">
            Край
          </p>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-sm font-light text-zinc-900">
            <CalendarIcon
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-300"
              strokeWidth={1.5}
            />
            {new Date(sub.endDate).toLocaleDateString("bg-BG")}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-zinc-400">
            Платено
          </p>
          <div className="text-[11px] sm:text-sm font-medium text-zinc-950">
            {formatPrice(sub.pricePaid)}
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap justify-start lg:justify-end items-center gap-2 sm:gap-3 col-span-2 lg:col-span-1 pt-4 sm:pt-0 border-t border-zinc-100/30 sm:border-t-0">
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

const RegisterPaymentDialog = ({
  sub,
  onPaymentSuccess,
  idToken,
}: {
  sub: Subscription;
  onPaymentSuccess: () => void;
  idToken: string | null;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  const amountDue = sub.price - sub.pricePaid;

  const [payAmount, setPayAmount] = useState<number>(amountDue);
  const [paymentMethod, setPaymentMethod] = useState<string>("В брой");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [note, setNote] = useState<string>("");
  const [generateReceipt, setGenerateReceipt] = useState<boolean>(true);
  const [createdSaleId, setCreatedSaleId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPayAmount(amountDue);
      setPaymentMethod("В брой");
      setPaymentDate(new Date());
      setNote("");
      setGenerateReceipt(true);
      setStep(1);
      setCreatedSaleId(null);
    }
  }, [isOpen, amountDue]);

  const handleNextStep1 = () => {
    if (payAmount <= 0) {
      toast.error("Грешка", {
        description: "Моля, въведете валидна сума за плащане.",
      });
      return;
    }
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    if (payAmount <= 0) return;
    setIsLoading(true);
    try {
      if (!idToken) {
        toast.error("Грешка", { description: "Липсва токен за оторизация." });
        return;
      }

      const newPayment = {
        date: paymentDate.toISOString(),
        amount: payAmount,
        paymentId: crypto.randomUUID(),
        paymentMethod: paymentMethod,
        note: note,
      };

      const updatedPaymentHistory = [...(sub.paymentHistory || []), newPayment];
      const newPricePaid = sub.pricePaid + payAmount;
      const newStatus =
        newPricePaid >= sub.price ? "active" : "pending_payment";

      // 1. Update subscription
      const updateRes = await updateSubscriptionAction(idToken, sub.id, {
        status: newStatus,
        pricePaid: newPricePaid,
        paymentHistory: updatedPaymentHistory,
        paymentsMadeCount: (sub.paymentsMadeCount || 0) + 1,
      });

      if (!updateRes.success) {
        toast.error("Грешка", {
          description: updateRes.message || "Грешка при запис на абонамента.",
        });
        setIsLoading(false);
        return;
      }

      // 2. Create Sale / Receipt
      const updatedSub = {
        ...sub,
        status: newStatus,
        pricePaid: newPricePaid,
        paymentHistory: updatedPaymentHistory,
        paymentsMadeCount: (sub.paymentsMadeCount || 0) + 1,
      };

      if (generateReceipt) {
        const saleRes = await findOrCreateSaleForSubscriptionAction(
          idToken,
          updatedSub
        );
        const data = saleRes.data as { id: string } | undefined;
        if (saleRes.success && data?.id) {
          setCreatedSaleId(data.id);
        }
      }

      toast.success("Успех!", {
        description: "Плащането е регистрирано успешно.",
      });
      onPaymentSuccess();
      setStep(3);
    } catch {
      toast.error("Грешка", {
        description: "Възникна проблем при регистриране на плащането.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    { id: "В брой", label: "В брой", icon: <Banknote className="h-4 w-4" /> },
    {
      id: "Revolut",
      label: "Revolut",
      icon: <CreditCard className="h-4 w-4" />,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-10 px-4 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-medium text-[10px] uppercase tracking-widest2 shadow-none"
        >
          Регистрирай плащане
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-4xl border-zinc-100 shadow-none p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-light tracking-tight text-zinc-950">
            Регистриране на плащане
          </DialogTitle>
          <DialogDescription className="text-xs font-light text-zinc-400">
            {sub.serviceName}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-4 mb-8 bg-zinc-50/80 p-3 rounded-2xl border border-zinc-100/80">
          <div
            className={`flex items-center gap-2 text-xs font-medium transition-all ${step === 1 ? "text-zinc-950" : step > 1 ? "text-emerald-600 font-normal" : "text-zinc-300"}`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${step === 1 ? "bg-zinc-950 text-white" : step > 1 ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"}`}
            >
              {step > 1 ? <Check className="h-3 w-3" /> : 1}
            </span>
            Детайли
          </div>
          <div className="flex-1 h-px bg-zinc-200 mx-3" />
          <div
            className={`flex items-center gap-2 text-xs font-medium transition-all ${step === 2 ? "text-zinc-950" : step > 2 ? "text-emerald-600 font-normal" : "text-zinc-300"}`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${step === 2 ? "bg-zinc-950 text-white" : step > 2 ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"}`}
            >
              {step > 2 ? <Check className="h-3 w-3" /> : 2}
            </span>
            Потвърждение
          </div>
          <div className="flex-1 h-px bg-zinc-200 mx-3" />
          <div
            className={`flex items-center gap-2 text-xs font-medium transition-all ${step === 3 ? "text-emerald-600 font-medium" : "text-zinc-300"}`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${step === 3 ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-500"}`}
            >
              3
            </span>
            Успех
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium tracking-widest uppercase text-zinc-400">
                <span>Сума за плащане (EUR)</span>
                <span className="text-zinc-600 font-semibold">
                  Дължимо: {formatPrice(amountDue)}
                </span>
              </div>
              <div className="relative flex items-center">
                <Input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) =>
                    setPayAmount(parseFloat(e.target.value) || 0)
                  }
                  className="h-12 rounded-2xl border-zinc-200 bg-white text-lg font-medium pl-4 pr-24 shadow-sm text-zinc-900"
                />
                <div className="absolute right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-[10px] px-2.5 rounded-xl font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    onClick={() => setPayAmount(amountDue)}
                  >
                    Пълна
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-[10px] px-2.5 rounded-xl font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    onClick={() =>
                      setPayAmount(parseFloat((amountDue / 2).toFixed(2)))
                    }
                  >
                    50%
                  </Button>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-widest uppercase text-zinc-400">
                Метод на плащане
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${paymentMethod === m.id ? "border-zinc-950 bg-zinc-950 text-white shadow-md font-medium" : "border-zinc-200/80 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-100 font-light"}`}
                  >
                    <div
                      className={
                        paymentMethod === m.id ? "text-white" : "text-zinc-500"
                      }
                    >
                      {m.icon}
                    </div>
                    <span className="text-xs">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-widest uppercase text-zinc-400">
                Дата на плащане
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-start text-left font-light text-xs sm:text-sm rounded-2xl border-zinc-200 bg-zinc-50/50 text-zinc-900"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
                    {format(paymentDate, "PPP", { locale: bg })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-2xl border-zinc-100 shadow-lg"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(d) => d && setPaymentDate(d)}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-widest uppercase text-zinc-400">
                Бележка / Основание (по избор)
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Напр. платено на каса, № превод..."
                className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/50 text-xs sm:text-sm font-light text-zinc-900"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="h-11 rounded-xl border-zinc-200 font-medium text-[11px] uppercase tracking-widest2"
              >
                Отказ
              </Button>
              <Button
                onClick={handleNextStep1}
                className="h-11 px-6 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[11px] uppercase tracking-widest2 shadow-none flex items-center gap-2"
              >
                Напред
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100/80 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                  Абонамент
                </span>
                <span className="text-sm font-medium text-zinc-900">
                  {sub.serviceName}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-500 font-light">
                  Сума за плащане
                </span>
                <span className="text-lg font-semibold text-zinc-950">
                  {formatPrice(payAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-500 font-light">
                  Метод на плащане
                </span>
                <span className="text-xs font-medium px-2.5 py-1 bg-white rounded-lg border border-zinc-200/80 text-zinc-800">
                  {paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-500 font-light">Дата</span>
                <span className="text-xs text-zinc-800 font-light">
                  {format(paymentDate, "dd.MM.yyyy")}
                </span>
              </div>
              {note && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-zinc-500 font-light">
                    Бележка
                  </span>
                  <span className="text-xs text-zinc-600 italic font-light">
                    {note}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200/60">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                  Оставащ дълг
                </span>
                <span className="text-xs font-semibold text-zinc-600">
                  {formatPrice(
                    Math.max(0, sub.price - (sub.pricePaid + payAmount))
                  )}
                </span>
              </div>
            </div>

            {/* Receipt Checkbox */}
            <label className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100 cursor-pointer hover:bg-zinc-100/50 transition-colors">
              <input
                type="checkbox"
                checked={generateReceipt}
                onChange={(e) => setGenerateReceipt(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-4 w-4"
              />
              <span className="text-xs sm:text-sm font-light text-zinc-700">
                Генерирай електронна квитанция след плащането
              </span>
            </label>

            {/* Footer */}
            <div className="flex justify-between gap-3 pt-4 border-t border-zinc-100">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="h-11 px-5 rounded-xl border-zinc-200 font-medium text-[11px] uppercase tracking-widest2 flex items-center gap-2 text-zinc-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Назад
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={isLoading}
                className="h-11 px-8 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-medium text-[11px] uppercase tracking-widest2 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Потвърди и плати
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
              <Check className="h-8 w-8 stroke-[2.5]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-light tracking-tight text-zinc-950">
                Плащането е прието!
              </h3>
              <p className="text-sm font-light text-zinc-500 max-w-sm mx-auto">
                Сумата от{" "}
                <span className="font-semibold text-zinc-900">
                  {formatPrice(payAmount)}
                </span>{" "}
                е успешно регистрирана към досието.
              </p>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
              {generateReceipt && createdSaleId && (
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/sales/${createdSaleId}/receipt`);
                  }}
                  className="h-12 px-6 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-xs sm:text-sm shadow-md flex items-center gap-2 justify-center"
                >
                  <Receipt className="h-4 w-4" />
                  Отвори квитанция
                </Button>
              )}
              <Button
                variant={
                  generateReceipt && createdSaleId ? "outline" : "default"
                }
                onClick={() => setIsOpen(false)}
                className={`h-12 px-6 rounded-2xl font-medium text-xs sm:text-sm justify-center ${!(generateReceipt && createdSaleId) ? "bg-zinc-950 text-white hover:bg-zinc-800 shadow-md" : "border-zinc-200 text-zinc-700"}`}
              >
                Затвори
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const MemberSubscriptionsTab = ({
  memberId,
  member,
}: {
  memberId: string;
  member?: Member;
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [allServices, setAllServices] = useState<ClubService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const { user, idToken } = useAuth();

  const [selectedSmartSuggestion, setSelectedSmartSuggestion] = useState<{
    serviceId: string;
    price: number;
    suggestedName?: string;
    month?: string;
  } | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const refreshData = () => setRefreshCount((count) => count + 1);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [srvs, subs] = await Promise.all([
          getAllClubServices(),
          getSubscriptionsByMemberId(memberId),
        ]);
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
  }, [memberId, refreshCount]);

  const handleSelectSmartService = (
    serviceId: string,
    price: number,
    suggestedName?: string,
    month?: string
  ) => {
    setSelectedSmartSuggestion({ serviceId, price, suggestedName, month });
    setIsAddDialogOpen(true);
  };

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
    <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl lg:rounded-5xl p-4 sm:p-8 lg:p-10">
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

      <div>
        {subscriptions.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50/50 border border-zinc-100 border-dashed rounded-4xl">
            <p className="text-[11px] font-medium uppercase tracking-widest2 text-zinc-300">
              Няма намерени абонаменти.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                service={allServices.find((s) => s.id === sub.serviceId)}
                onSubscriptionUpdate={refreshData}
                user={user}
                idToken={idToken}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
