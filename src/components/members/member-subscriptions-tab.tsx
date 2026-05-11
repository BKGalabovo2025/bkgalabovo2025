"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
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
import { Subscription, ClubService } from "@/types";
import { useAuth } from "@/context/auth-context";
import {
  PlusCircle,
  Loader2,
  CalendarIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { formatPrice } from "@/lib/currency";

// Helper functions for date calculations
const calculateNextStartDate = (currentEndDate: string | Date): Date => {
  const endDate = new Date(currentEndDate);
  endDate.setDate(endDate.getDate() + 1);
  return endDate;
};

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
}: {
  memberId: string;
  services: ClubService[];
  onSubscriptionAdded: () => void;
  user: User | null;
  idToken: string | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);

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

      const endDate = calculateEndDate(startDate, service.billingPeriod);

      const result = await createSubscriptionAction(idToken, {
        memberId: memberId,
        serviceId: service.id,
        serviceName: service.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: "pending_payment", // New subscriptions require payment
        pricePaid: 0,
        price: service.price, // Store the price as a whole number
        currency: "EUR", // ALWAYS set new subscriptions to EUR
        paymentHistory: [],
        paymentsMadeCount: 0,
        totalPaymentsCount: 1, // Or based on service type
      });

      if (result.success) {
        toast.success("Успех!", {
          description: "Абонаментът е добавен и очаква плащане.",
        });
        onSubscriptionAdded(); // Refresh the parent list
        setIsOpen(false);
        // Reset state
        setSelectedServiceId(null);
        setStartDate(new Date());
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 px-6 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-medium uppercase tracking-widest2 shadow-none">
          <PlusCircle className="mr-2 h-3.5 w-3.5" />
          Добави абонамент
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-4xl border-zinc-100 shadow-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-light tracking-tight">
            Добавяне на нов абонамент
          </DialogTitle>
          <DialogDescription className="text-sm font-light text-zinc-400">
            Изберете услуга и начална дата, за да създадете нов абонамент за
            члена.
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
              onValueChange={setSelectedServiceId}
              defaultValue={selectedServiceId || undefined}
            >
              <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50">
                <SelectValue placeholder="Изберете услуга..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 shadow-none">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({formatPrice(service.price)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            onClick={() => setIsOpen(false)}
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
      if (result.success && result.data?.id) {
        onUpdate();
        router.push(`/sales/${result.data.id}/receipt`);
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
}: {
  sub: Subscription;
  service?: ClubService;
  onSubscriptionUpdate: () => void;
  user: any;
  idToken: string | null;
}) => {
  const [isRenewing, setIsRenewing] = useState(false);
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

  const handleRenew = async () => {
    if (!service) {
      toast.error("Услугата не беше намерена.");
      return;
    }

    setIsRenewing(true);
    try {
      if (!idToken) {
        toast.error("Липсва оторизация.");
        return;
      }

      const nextStartDate = calculateNextStartDate(sub.endDate);
      const nextEndDate = calculateEndDate(
        nextStartDate,
        service.billingPeriod
      );

      const result = await createSubscriptionAction(idToken, {
        memberId: sub.memberId,
        serviceId: sub.serviceId,
        serviceName: service.name,
        price: service.price,
        currency: "EUR",
        startDate: nextStartDate.toISOString(),
        endDate: nextEndDate.toISOString(),
        status: "pending_payment",
        pricePaid: 0,
        paymentHistory: [],
        paymentsMadeCount: 0,
        totalPaymentsCount: 1,
      });

      if (result.success) {
        toast.success("Успешно подновен", {
          description: result.message,
        });
        onSubscriptionUpdate();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Error renewing subscription:", error);
      toast.error("Грешка при подновяване");
    } finally {
      setIsRenewing(false);
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
  const isExpired = statusInfo.text === "Изтекъл";

  return (
    <div
      className={`border border-zinc-100 rounded-4xl p-8 mb-6 ${statusInfo.bgColor} transition-all hover:bg-zinc-50/50`}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-light text-2xl tracking-tight text-zinc-950">
          {sub.serviceName}
        </h4>
        <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full border border-zinc-100 bg-white">
          {statusInfo.icon}
          <span className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-950">
            {statusInfo.text}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8 items-end">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-2">
            Начало
          </p>
          <div className="flex items-center gap-2 text-sm font-light text-zinc-900">
            <CalendarIcon
              className="h-3.5 w-3.5 text-zinc-300"
              strokeWidth={1.5}
            />{" "}
            {new Date(sub.startDate).toLocaleDateString("bg-BG")}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-2">
            Край
          </p>
          <div className="flex items-center gap-2 text-sm font-light text-zinc-900">
            <CalendarIcon
              className="h-3.5 w-3.5 text-zinc-300"
              strokeWidth={1.5}
            />
            {new Date(sub.endDate).toLocaleDateString("bg-BG")}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-2">
            Платено
          </p>
          <div className="text-sm font-medium text-zinc-950">
            {formatPrice(sub.pricePaid)}
          </div>
        </div>
        <div className="flex justify-end items-center gap-3">
          {isPaid && (
            <ReceiptButton subscription={sub} onUpdate={onSubscriptionUpdate} />
          )}
          {isExpired && (
            <Button
              size="sm"
              onClick={handleRenew}
              disabled={isRenewing}
              className="h-10 px-4 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[10px] uppercase tracking-widest2 shadow-none"
            >
              {isRenewing ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
              )}
              Подновяване
            </Button>
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
            className="h-10 w-10 p-0 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
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
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const amountToPay = sub.price - sub.pricePaid;

  const handlePayment = async () => {
    if (amountToPay <= 0) {
      toast.info("Информация", {
        description: "Няма дължима сума за този абонамент.",
      });
      return;
    }
    setIsLoading(true);
    try {
      if (!idToken) {
        toast.error("Грешка", { description: "Липсва токен за оторизация." });
        return;
      }

      // Update subscription status and price paid
      const result = await updateSubscriptionAction(idToken, sub.id, {
        status: "active",
        pricePaid: sub.price,
      });

      if (result.success) {
        // Ensure a sale is created and marked as paid
        await findOrCreateSaleForSubscriptionAction(idToken, {
          ...sub,
          status: "active",
          pricePaid: sub.price,
        });

        toast.success("Успех!", {
          description: "Плащането е регистрирано успешно.",
        });
        onPaymentSuccess();
        setIsOpen(false);
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch {
      toast.error("Грешка", { description: "Неуспешен запис на плащането." });
    } finally {
      setIsLoading(false);
    }
  };

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
      <DialogContent className="rounded-4xl border-zinc-100 shadow-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-light tracking-tight">
            Потвърждение на плащане
          </DialogTitle>
          <DialogDescription className="text-sm font-light text-zinc-400">
            Прегледайте сумата и потвърдете регистрирането на плащането.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <p className="text-sm font-light text-zinc-600 leading-relaxed">
            Ще регистрирате плащане от{" "}
            <span className="font-medium text-zinc-950">
              {formatPrice(amountToPay)}
            </span>{" "}
            за абонамент{" "}
            <span className="font-medium text-zinc-950">{sub.serviceName}</span>
            . Сигурни ли сте?
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="h-11 rounded-xl border-zinc-100 font-medium text-[11px] uppercase tracking-widest2"
          >
            Отказ
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="h-11 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[11px] uppercase tracking-widest2 shadow-none"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Потвърди"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const MemberSubscriptionsTab = ({ memberId }: { memberId: string }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [services, setServices] = useState<ClubService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const { user, idToken } = useAuth();

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
          setServices(srvs.filter((s) => s.type === "Абонамент"));
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
    <div className="bg-white border border-zinc-100 rounded-5xl p-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-light tracking-tighter text-zinc-950 mb-2">
            Абонаменти
          </h2>
          <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
            Списък с всички активни и изминали абонаменти.
          </p>
        </div>
        <AddSubscriptionDialog
          memberId={memberId}
          services={services}
          onSubscriptionAdded={refreshData}
          user={user}
          idToken={idToken}
        />
      </div>

      <div>
        {subscriptions.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50/50 border border-zinc-100 border-dashed rounded-4xl">
            <p className="text-[11px] font-medium uppercase tracking-widest2 text-zinc-300">
              Няма намерени абонаменти.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                service={services.find((s) => s.id === sub.serviceId)}
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
