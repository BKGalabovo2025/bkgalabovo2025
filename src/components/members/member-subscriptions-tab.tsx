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

      // Start date is the day after the current subscription ends, or today if that ended in the past
      let nextStartDate = new Date(
        currentEndDate.getTime() + 24 * 60 * 60 * 1000
      );
      if (nextStartDate < now) {
        nextStartDate = now;
      }
      nextStartDate.setHours(0, 0, 0, 0);

      // End date: calculate based on billingPeriod of related service, or default to Месечен
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
        <div>
          <h4 className="font-light text-xl sm:text-2xl tracking-tight text-zinc-950">
            {sub.serviceName}
          </h4>
          {currentMemberId &&
            sub.memberId !== currentMemberId &&
            familyMembers && (
              <span className="text-xs text-amber-600 font-medium block mt-1">
                За член на семейството:{" "}
                {familyMembers.find((m) => m.id === sub.memberId)?.firstName ||
                  "Член на семейството"}{" "}
                {familyMembers.find((m) => m.id === sub.memberId)?.lastName ||
                  ""}
              </span>
            )}
        </div>
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
          {statusInfo.text === "Изтекъл" && (
            <Button
              size="sm"
              onClick={handleRenew}
              disabled={isRenewing}
              className="h-10 px-4 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[10px] uppercase tracking-widest2 shadow-none flex items-center gap-2"
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
        {subscriptions.filter((sub) => sub.status === "pending_payment")
          .length === 0 && pendingSales.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50/50 border border-zinc-100 border-dashed rounded-4xl">
            <p className="text-[11px] font-medium uppercase tracking-widest2 text-zinc-300">
              Няма чакащи задължения.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Рендериране на чакащи продажби */}
            {pendingSales.map((sale) => (
              <div
                key={`sale-${sale.id}`}
                className="bg-white border border-rose-100 rounded-3xl p-6 shadow-sm shadow-rose-900/5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 rounded-l-3xl"></div>
                <div className="flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-zinc-900">
                      {sale.items
                        .map(
                          (i: any) =>
                            `${i.name}${i.quantity > 1 ? ` (x${i.quantity})` : ""}`
                        )
                        .join(", ")}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium text-zinc-400">
                      <span className="text-rose-500 uppercase tracking-widest2 text-[10px]">
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
                      <p className="text-[10px] uppercase font-medium tracking-widest2 text-zinc-400">
                        Сума
                      </p>
                      <p className="text-xl font-medium text-zinc-900">
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

            {/* Рендериране на чакащи абонаменти (стара логика, ако има такива) */}
            {subscriptions
              .filter((sub) => sub.status === "pending_payment")
              .map((sub) => (
                <SubscriptionCard
                  key={`sub-${sub.id}`}
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
