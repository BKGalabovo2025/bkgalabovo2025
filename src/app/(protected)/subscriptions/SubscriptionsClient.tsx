"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { DataTable } from "@/components/shared/data-table";
import { columns, SubscriptionData } from "@/components/subscriptions/columns";
import { Subscription, ClubService, Member } from "@/types";
import {
  getAllClubServices,
  getAllMemberSubscriptions,
} from "@/services/subscription-service";
import {
  createSubscriptionAction,
  updateSubscriptionAction,
  deleteSubscriptionAction,
} from "@/lib/actions/subscriptions";
import { getAllMembers } from "@/services/member-service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  CreditCard,
  UserCheck,
  AlertCircle,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { getFirebaseAuth } from "@/lib/firebase";
import { User } from "firebase/auth";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { getDocs } from "firebase/firestore";
import { getEventsCollection } from "@/lib/firebase-collections";
import { ScheduleEvent } from "@/types";
import { getMembershipSuggestions } from "@/lib/membership-utils";

export default function SubscriptionsClient() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<
    Subscription | undefined
  >(undefined);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const { data, isLoading, mutate } = useSWR(
    "subscriptions-page-data",
    async () => {
      const [fetchedServices, fetchedMembers, allSubscriptions] =
        await Promise.all([
          getAllClubServices(),
          getAllMembers(),
          getAllMemberSubscriptions(),
        ]);
      return { fetchedServices, fetchedMembers, allSubscriptions };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const {
    services = [],
    members = [],
    subscriptions = [],
  } = useMemo(() => {
    if (!data) return { services: [], members: [], subscriptions: [] };

    const { fetchedServices, fetchedMembers, allSubscriptions } = data;

    const memberMap = new Map(fetchedMembers.map((m: Member) => [m.id, m]));
    const serviceMap = new Map(
      fetchedServices.map((s: ClubService) => [s.id, s])
    );

    const enrichedSubscriptions: SubscriptionData[] = allSubscriptions.map(
      (sub: Subscription) => {
        const service = serviceMap.get(sub.serviceId);
        const member = memberMap.get(sub.memberId);
        return {
          ...sub,
          serviceName: service?.name || "Unknown Service",
          memberFirstName: member?.firstName || "Unknown",
          memberMiddleName: member?.middleName || "",
          memberLastName: member?.lastName || "Member",
        };
      }
    );

    return {
      services: fetchedServices,
      members: fetchedMembers,
      subscriptions: enrichedSubscriptions,
    };
  }, [data]);

  const handleAutoSync = async () => {
    if (!user) return;
    setIsSaving(true);
    const toastId = toast.loading(
      "Сканиране на историята и генериране на членства..."
    );

    try {
      const idToken = await user.getIdToken();

      // 1. Fetch all events across months to check historical attendance
      const eventsSnap = await getDocs(getEventsCollection());
      const allEvents = eventsSnap.docs.map((d) => d.data() as ScheduleEvent);

      if (allEvents.length === 0) {
        toast.dismiss(toastId);
        toast.info("Няма регистрирани събития или тренировки в системата.");
        setIsSaving(false);
        return;
      }

      const createdCount = { count: 0 };
      const now = new Date();
      const nowYear = now.getFullYear();
      const nowMonth = now.getMonth();

      // 2. Iterate through each active member
      for (const member of members) {
        if (!member || member.status === "inactive") continue;

        // Determine earliest activity by checking historical event attendance
        const memberEvents = allEvents.filter((e) =>
          e.attendeeMemberIds?.includes(member.id)
        );

        let earliestDate = new Date(member.registrationDate);
        if (isNaN(earliestDate.getTime())) {
          earliestDate = new Date(nowYear, 0, 1); // fallback to start of year
        }

        if (memberEvents.length > 0) {
          const eventDates = memberEvents
            .map((e) => new Date(e.startDate || ""))
            .filter((d) => !isNaN(d.getTime()));
          if (eventDates.length > 0) {
            const minEventDate = new Date(
              Math.min(...eventDates.map((d) => d.getTime()))
            );
            if (minEventDate < earliestDate) {
              earliestDate = minEventDate;
            }
          }
        }

        let y = earliestDate.getFullYear();
        let m = earliestDate.getMonth();

        // Loop from earliest activity month to current month
        while (y < nowYear || (y === nowYear && m <= nowMonth)) {
          const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`; // "YYYY-MM"
          const firstDayOfMonth = new Date(y, m, 1);
          const lastDayOfMonth = new Date(y, m + 1, 0);
          lastDayOfMonth.setHours(23, 59, 59, 999);

          const validStartDate =
            y === earliestDate.getFullYear() &&
            m === earliestDate.getMonth() &&
            earliestDate > firstDayOfMonth
              ? earliestDate
              : firstDayOfMonth;

          // Check member attendance for this specific month
          const monthEvents = allEvents.filter((e) => {
            if (!e.startDate?.startsWith(monthStr)) return false;
            return e.attendeeMemberIds?.includes(member.id);
          });
          const attendanceInMonth = monthEvents.length;

          if (attendanceInMonth > 0) {
            // Check if member already has an active or pending subscription for this month
            const hasSub = subscriptions.some((s) => {
              if (s.memberId !== member.id) return false;
              if (s.status === "cancelled") return false;

              const start = new Date(s.startDate);
              const end = new Date(s.endDate);
              return start <= lastDayOfMonth && end >= firstDayOfMonth;
            });

            if (!hasSub) {
              const suggestions = getMembershipSuggestions(
                member,
                services,
                attendanceInMonth
              );

              if (suggestions.length > 0) {
                const bestItem = suggestions[0];
                const bestService = bestItem.service;
                const subPrice = bestItem.suggestedPrice ?? bestService.price;
                const subServiceName =
                  bestItem.suggestedServiceName ?? bestService.name;

                const newSub: Omit<Subscription, "id" | "siteId"> = {
                  memberId: member.id,
                  serviceId: bestService.id,
                  serviceName: subServiceName,
                  startDate: validStartDate.toISOString(),
                  endDate: lastDayOfMonth.toISOString(),
                  status: "pending_payment",
                  price: subPrice,
                  pricePaid: 0,
                  currency: bestService.currency,
                  paymentsMadeCount: 0,
                  totalPaymentsCount: 1,
                  licenseGranted: false,
                  apparelGranted: false,
                  linkedSubscriptionId: null,
                  paymentHistory: [],
                };

                await createSubscriptionAction(idToken, newSub);
                createdCount.count++;
              }
            }
          }

          m++;
          if (m > 11) {
            m = 0;
            y++;
          }
        }
      }

      toast.dismiss(toastId);
      if (createdCount.count > 0) {
        toast.success(
          `Успешно генерирани ${createdCount.count} нови неплатени членства по месеци.`
        );
        mutate();
      } else {
        toast.info(
          "Всички членове с посещения вече имат регистрирано членство за съответните месеци."
        );
      }
    } catch (err) {
      console.error("Error during auto-sync:", err);
      toast.dismiss(toastId);
      toast.error("Грешка при интелигентното генериране.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (formData: Omit<Subscription, "id" | "siteId">) => {
    if (!user) {
      toast.error("Грешка", {
        description: "Трябва да сте влезли в системата.",
      });
      return;
    }
    setIsSaving(true);
    try {
      const idToken = await user.getIdToken();
      let result;

      if (selectedSubscription) {
        result = await updateSubscriptionAction(
          idToken,
          selectedSubscription.id,
          formData
        );
      } else {
        result = await createSubscriptionAction(idToken, formData);
      }

      if (result.success) {
        toast.success(result.message);
        setIsFormOpen(false);
        setSelectedSubscription(undefined);
        mutate();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (err) {
      console.error("Error saving subscription:", err);
      toast.error("Грешка при записа");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast.error("Грешка", {
        description: "Трябва да сте влезли в системата.",
      });
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const result = await deleteSubscriptionAction(idToken, id);

      if (result.success) {
        toast.success(result.message);
        mutate();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (err) {
      console.error("Error deleting subscription:", err);
      toast.error("Грешка при изтриването");
    }
  };

  const openForm = (subscription?: SubscriptionData) => {
    const fullSubscription = subscription
      ? subscriptions.find((s) => s.id === subscription.id)
      : undefined;
    setSelectedSubscription(fullSubscription);
    setIsFormOpen(true);
  };

  const activeCount = subscriptions.filter((s) => {
    const end = new Date(s.endDate);
    return end >= new Date() && s.status === "active";
  }).length;

  const pendingCount = subscriptions.filter(
    (s) => s.status === "pending_payment"
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Членство"
        description="Управление на клубни карти, предплатени услуги и валидност на членството."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членство" },
        ]}
      >
        <div className="flex gap-3">
          <Button
            onClick={handleAutoSync}
            disabled={isSaving}
            variant="outline"
            className="rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-50 h-12 px-6 font-medium text-[10px] uppercase tracking-widest transition-all"
          >
            {isSaving ? (
              <RefreshCcw className="mr-3 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-3 h-4 w-4 text-amber-500" />
            )}
            Умно генериране
          </Button>

          <Button
            onClick={() => openForm()}
            className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
          >
            <PlusCircle className="mr-3 h-4 w-4" strokeWidth={1.5} /> Добави
            плащане
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <BentoCard className="p-8 bg-white border border-zinc-100 shadow-none rounded-4xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-light tracking-tighter mb-2">
                {subscriptions.length}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
                Общо карти
              </p>
            </div>
            <CreditCard className="h-5 w-5 text-zinc-300" strokeWidth={1.5} />
          </div>
        </BentoCard>

        <BentoCard className="p-8 border-zinc-100 bg-white shadow-none rounded-4xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-light tracking-tighter text-emerald-600 mb-2">
                {activeCount}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
                Активни
              </p>
            </div>
            <UserCheck className="h-5 w-5 text-emerald-500" strokeWidth={1.5} />
          </div>
        </BentoCard>

        <BentoCard className="p-8 border-zinc-100 bg-white shadow-none rounded-4xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-light tracking-tighter text-amber-600 mb-2">
                {pendingCount}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
                Чакащи плащане
              </p>
            </div>
            <RefreshCcw className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
          </div>
        </BentoCard>

        <BentoCard className="p-8 border-zinc-100 bg-zinc-900 text-white shadow-none rounded-4xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-light tracking-tighter text-amber-400 mb-2">
                {
                  subscriptions.filter((s) => {
                    const end = new Date(s.endDate);
                    return (
                      end.getTime() - new Date().getTime() <
                        7 * 24 * 60 * 60 * 1000 && s.status === "active"
                    );
                  }).length
                }
              </p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
                Изтичащи скоро
              </p>
            </div>
            <AlertCircle className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
          </div>
        </BentoCard>
      </div>

      <BentoCard className="p-0 overflow-hidden border border-zinc-100 bg-white shadow-none rounded-4xl">
        <div className="p-10">
          <DataTable
            columns={columns(openForm, handleDelete)}
            data={subscriptions}
            isLoading={isLoading}
            filterColumnId="memberLastName"
            filterPlaceholder="Търсене по фамилия на член..."
            emptyStateMessage="Няма намерени записи за членство."
          />
        </div>
      </BentoCard>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[95vh] rounded-4xl border-none shadow-2xl p-0 flex flex-col overflow-hidden">
          <div className="p-8 bg-zinc-50 border-b border-zinc-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium uppercase tracking-[0.2em] text-zinc-900">
                {selectedSubscription ? "Редакция на плащане" : "Ново плащане"}
              </DialogTitle>
              <DialogDescription className="text-[11px] uppercase tracking-widest text-zinc-400 mt-2">
                Попълнете детайлите за клубната карта.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 overflow-y-auto">
            <SubscriptionForm
              members={members}
              services={services}
              onSave={handleSave}
              onClose={() => setIsFormOpen(false)}
              initialData={selectedSubscription}
              isSaving={isSaving}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
