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
import { getDocs, query, where } from "firebase/firestore";
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
    const toastId = toast.loading("Синхронизиране на посещения и плащания...");

    try {
      const idToken = await user.getIdToken();
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

      // 1. Fetch events for the month
      const eventsSnap = await getDocs(
        query(
          getEventsCollection(),
          where("startDate", ">=", `${currentMonth}-01`),
          where("startDate", "<=", `${currentMonth}-31`)
        )
      );
      const events = eventsSnap.docs.map((d) => d.data() as ScheduleEvent);

      // 2. Identify members with attendance
      const attendedMemberIds = new Set<string>();
      events.forEach((e) => {
        e.attendeeMemberIds?.forEach((id) => attendedMemberIds.add(id));
      });

      if (attendedMemberIds.size === 0) {
        toast.dismiss(toastId);
        toast.info("Няма засечени посещения за текущия месец.");
        setIsSaving(false);
        return;
      }

      // 3. Filter members who already have a subscription for this month
      const createdCount = { count: 0 };
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      for (const memberId of attendedMemberIds) {
        const member = members.find((m) => m.id === memberId);
        if (!member) continue;

        // Check 1: Already has a subscription for this month
        const hasSub = subscriptions.some((s) => {
          if (s.memberId !== memberId) return false;
          if (s.status === "cancelled") return false;

          const start = new Date(s.startDate);
          const end = new Date(s.endDate);
          return start <= lastDayOfMonth && end >= firstDayOfMonth;
        });

        if (hasSub) continue;

        // Check 2: Check registration date - don't generate sub for months before registration
        const regDate = new Date(member.registrationDate);
        if (regDate > lastDayOfMonth) continue;

        const attendanceInMonth = events.filter((e) =>
          e.attendeeMemberIds?.includes(memberId)
        ).length;
        const suggestions = getMembershipSuggestions(
          member,
          services,
          attendanceInMonth
        );

        if (suggestions.length > 0) {
          const best = suggestions[0].service;

          // Calculate valid start date (max of first of month or registration date)
          const validStartDate =
            regDate > firstDayOfMonth ? regDate : firstDayOfMonth;

          // Get actual last day of month
          const actualLastDay = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
          );
          actualLastDay.setHours(23, 59, 59, 999);

          const newSub: Omit<Subscription, "id" | "siteId"> = {
            memberId: member.id,
            serviceId: best.id,
            serviceName: best.name,
            startDate: validStartDate.toISOString(),
            endDate: actualLastDay.toISOString(),
            status: "pending_payment",
            price: best.price,
            pricePaid: 0,
            currency: best.currency,
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

      toast.dismiss(toastId);
      if (createdCount.count > 0) {
        toast.success(
          `Успешно генерирани ${createdCount.count} нови неплатени членства.`
        );
        mutate();
      } else {
        toast.info(
          "Всички присъстващи членове вече имат регистрирано членство."
        );
      }
    } catch (err) {
      console.error("Error during auto-sync:", err);
      toast.dismiss(toastId);
      toast.error("Грешка при автоматичното синхронизиране.");
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
