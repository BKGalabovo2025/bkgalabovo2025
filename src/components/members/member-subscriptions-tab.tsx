"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  createSubscription,
  updateSubscription,
} from "@/services/subscription-service";
import { findOrCreateSaleForSubscription } from "@/services/sales-service";
import { Subscription, ClubService, Member } from "@/types";
import {
  PlusCircle,
  Loader2,
  CalendarIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { formatPrice } from "@/lib/currency";
import { getFirebaseAuth } from "@/lib/firebase";
import { User } from "firebase/auth";

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
}: {
  memberId: string;
  services: ClubService[];
  onSubscriptionAdded: () => void;
  user: User | null;
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
      const endDate = calculateEndDate(startDate, service.billingPeriod);

      await createSubscription(
        {
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
        },
        user.uid,
        user.displayName || "Система"
      );

      toast.success("Успех!", {
        description: "Абонаментът е добавен и очаква плащане.",
      });
      onSubscriptionAdded(); // Refresh the parent list
      setIsOpen(false);
      // Reset state
      setSelectedServiceId(null);
      setStartDate(new Date());
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
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Добави абонамент
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавяне на нов абонамент</DialogTitle>
          <DialogDescription>
            Изберете услуга и начална дата, за да създадете нов абонамент за
            члена.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="service" className="text-right">
              Услуга
            </label>
            <Select
              onValueChange={setSelectedServiceId}
              defaultValue={selectedServiceId || undefined}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Изберете услуга..." />
              </SelectTrigger>
              <SelectContent id="service">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({formatPrice(service.price)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="start-date" className="text-right">
              Начална дата
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP", { locale: bg })
                  ) : (
                    <span>Изберете дата</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Отказ
          </Button>
          <Button onClick={handleAddSubscription} disabled={isLoading}>
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

  const handleReceiptClick = async () => {
    setIsLoading(true);
    try {
      const sale = await findOrCreateSaleForSubscription(subscription);
      if (sale && sale.id) {
        onUpdate();
        router.push(`/sales/${sale.id}/receipt`);
      } else {
        toast.error("Грешка", {
          description: "Не може да бъде генерирана квитанция.",
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
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Receipt className="mr-2 h-4 w-4" />
      )}
      Квитанция
    </Button>
  );
};

const SubscriptionCard = ({
  sub,
  service,
  onSubscriptionUpdate,
  user,
}: {
  sub: Subscription;
  service?: ClubService;
  onSubscriptionUpdate: () => void;
  user: User | null;
}) => {
  const [isRenewing, setIsRenewing] = useState(false);

  const getStatusInfo = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endDate = new Date(sub.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (sub.status !== "cancelled" && now > endDate) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        text: "Изтекъл",
        color: "border-red-500",
      };
    }
    switch (sub.status) {
      case "active":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          text: "Активен",
          color: "border-green-500",
        };
      case "pending_payment":
        return {
          icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
          text: "Чакащо плащане",
          color: "border-yellow-500",
        };
      case "cancelled":
        return {
          icon: <XCircle className="h-4 w-4 text-gray-500" />,
          text: "Отменен",
          color: "border-gray-500",
        };
      default:
        return {
          icon: <XCircle className="h-4 w-4 text-gray-500" />,
          text: "Неактивен",
          color: "border-gray-500",
        };
    }
  };

  const handleRenew = async () => {
    if (!service || !user) return;
    setIsRenewing(true);
    try {
      const nextStartDate = calculateNextStartDate(sub.endDate);
      const nextEndDate = calculateEndDate(
        nextStartDate,
        service.billingPeriod
      );

      await createSubscription(
        {
          memberId: sub.memberId,
          serviceId: sub.serviceId,
          serviceName: service.name,
          price: service.price, // Price is already a whole number
          currency: "EUR", // Always EUR
          startDate: nextStartDate.toISOString(),
          endDate: nextEndDate.toISOString(),
          status: "pending_payment",
          pricePaid: 0,
          paymentHistory: [],
          paymentsMadeCount: 0,
          totalPaymentsCount: 1,
        },
        user.uid,
        user.displayName || "Система"
      );

      toast.success("Успешно подновен", {
        description: `Създаден е нов абонамент за периода ${nextStartDate.toLocaleDateString("bg-BG")}.`,
      });
      onSubscriptionUpdate();
    } catch {
      toast.error("Грешка при подновяване");
    } finally {
      setIsRenewing(false);
    }
  };

  const statusInfo = getStatusInfo();
  const isPaid = sub.pricePaid > 0;
  const isExpired = statusInfo.text === "Изтекъл";

  return (
    <div
      className={`border-l-4 ${statusInfo.color} rounded-md bg-muted/20 p-4 mb-4`}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-lg">{sub.serviceName}</h4>
        <div className="flex items-center space-x-2">
          {statusInfo.icon}
          <span className="font-semibold">{statusInfo.text}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm items-center">
        <div>
          <p className="text-muted-foreground">Начало</p>
          <p className="font-medium">
            <CalendarIcon className="mr-2 h-4 w-4 inline" />{" "}
            {new Date(sub.startDate).toLocaleDateString("bg-BG")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Край</p>
          <p className="font-medium">
            <CalendarIcon className="mr-2 h-4 w-4 inline" />
            {new Date(sub.endDate).toLocaleDateString("bg-BG")}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Платено</p>
          <p className="font-medium">{formatPrice(sub.pricePaid)}</p>
        </div>
        <div className="flex justify-end items-center gap-2">
          {isPaid && (
            <ReceiptButton subscription={sub} onUpdate={onSubscriptionUpdate} />
          )}
          {isExpired && (
            <Button size="sm" onClick={handleRenew} disabled={isRenewing}>
              {isRenewing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Подновяване
            </Button>
          )}
          {sub.status === "pending_payment" && (
            <RegisterPaymentDialog
              sub={sub}
              onPaymentSuccess={onSubscriptionUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const RegisterPaymentDialog = ({
  sub,
  onPaymentSuccess,
}: {
  sub: Subscription;
  onPaymentSuccess: () => void;
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
      // Update subscription status and price paid
      await updateSubscription(sub.id, {
        status: "active",
        pricePaid: sub.price,
      });

      // Ensure a sale is created and marked as paid
      await findOrCreateSaleForSubscription(sub);

      toast.success("Успех!", {
        description: "Плащането е регистрирано успешно.",
      });
      onPaymentSuccess();
      setIsOpen(false);
    } catch {
      toast.error("Грешка", { description: "Неуспешен запис на плащането." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Регистрирай плащане</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Потвърждение на плащане</DialogTitle>
          <DialogDescription>
            Прегледайте сумата и потвърдете регистрирането на плащането.
          </DialogDescription>
        </DialogHeader>
        <p>
          Ще регистрирате плащане от <strong>{formatPrice(amountToPay)}</strong>{" "}
          за абонамент <strong>{sub.serviceName}</strong>. Сигурни ли сте?
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Отказ
          </Button>
          <Button onClick={handlePayment} disabled={isLoading}>
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

export const MemberSubscriptionsTab = ({ 
  memberId, 
  familyMembers, 
  showFamily 
}: { 
  memberId: string, 
  familyMembers: Member[], 
  showFamily?: boolean 
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [services, setServices] = useState<ClubService[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const refreshData = () => setRefreshCount(count => count + 1);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const memberIds = showFamily 
          ? [memberId, ...familyMembers.map(m => m.id)]
          : [memberId];

        const [srvs, subsResults] = await Promise.all([
          getAllClubServices(),
          Promise.all(memberIds.map(id => getSubscriptionsByMemberId(id))),
        ]);

        if (isMounted) {
          const subs = subsResults.flat().sort(
            (a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          setSubscriptions(subs);
          setServices(srvs.filter((s) => s.type === "Абонамент"));
        }
      } catch {
        if (isMounted) {
          toast.error("Грешка", { description: "Неуспешно зареждане на данните." });
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
  }, [memberId, familyMembers, showFamily, refreshCount]);

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Абонаменти</CardTitle>
          <CardDescription>
            Списък с всички активни и изминали абонаменти.
          </CardDescription>
        </div>
        <AddSubscriptionDialog
          memberId={memberId}
          services={services}
          onSubscriptionAdded={refreshData}
          user={user}
        />
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
            <p>Няма намерени абонаменти.</p>
          </div>
        ) : (
          <div>
            {subscriptions.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                service={services.find((s) => s.id === sub.serviceId)}
                onSubscriptionUpdate={refreshData}
                user={user}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
