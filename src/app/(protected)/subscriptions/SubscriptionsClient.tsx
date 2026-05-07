"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { DataTable } from "@/components/shared/data-table";
import { columns, SubscriptionData } from "@/components/subscriptions/columns";
import { Subscription, ClubService, Member } from "@/types";
import {
  getAllClubServices,
  getAllMemberSubscriptions,
  createSubscription,
  updateSubscription,
} from "@/services/subscription-service";
import { getAllMembers } from "@/services/member-service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlusCircle, CreditCard, UserCheck, AlertCircle } from "lucide-react";
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

  const handleSave = async (formData: Omit<Subscription, "id">) => {
    if (!user) {
      toast.error("Грешка", {
        description: "Трябва да сте влезли в системата.",
      });
      return;
    }
    setIsSaving(true);
    try {
      if (selectedSubscription) {
        await updateSubscription(selectedSubscription.id, formData);
        toast.success("Абонаментът е обновен успешно!");
      } else {
        await createSubscription(
          formData,
          user.uid,
          user.displayName || "System"
        );
        toast.success("Абонаментът е създаден успешно!");
      }
      setIsFormOpen(false);
      setSelectedSubscription(undefined);
      mutate();
    } catch (err) {
      console.error("Error saving subscription:", err);
      toast.error("Грешка при записа");
    } finally {
      setIsSaving(false);
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Абонаменти"
        description="Управление на клубни карти, предплатени услуги и валидност на абонаментите."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Абонаменти" },
        ]}
      >
        <Button
          onClick={() => openForm()}
          className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
        >
          <PlusCircle className="mr-3 h-4 w-4" strokeWidth={1.5} /> Добави
          абонамент
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <BentoCard className="p-8 bg-white border border-zinc-100 shadow-none rounded-[2rem]">
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
        <BentoCard className="p-8 border-zinc-100 bg-white shadow-none rounded-[2rem]">
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
        <BentoCard className="md:col-span-2 p-8 flex items-center bg-zinc-950 text-white border-none shadow-none rounded-[2rem]">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <AlertCircle
                className="h-6 w-6 text-yellow-400"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-zinc-500 uppercase tracking-[0.3em] text-[9px] mb-2">
                Важно съобщение
              </p>
              <p className="text-xl font-light text-zinc-100 tracking-tight">
                Изтичащи абонаменти
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Проверете картите, които изтичат през следващите 7 дни.
              </p>
            </div>
          </div>
        </BentoCard>
      </div>

      <BentoCard className="p-0 overflow-hidden border border-zinc-100 bg-white shadow-none rounded-[2.5rem]">
        <div className="p-8">
          <DataTable
            columns={columns(openForm)}
            data={subscriptions}
            isLoading={isLoading}
            filterColumnId="memberLastName"
            filterPlaceholder="Търсене по фамилия..."
            emptyStateMessage="Няма намерени абонаменти."
          />
        </div>
      </BentoCard>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 bg-zinc-50 border-b border-zinc-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium uppercase tracking-[0.2em] text-zinc-900">
                {selectedSubscription
                  ? "Редакция на абонамент"
                  : "Нов абонамент"}
              </DialogTitle>
              <DialogDescription className="text-[11px] uppercase tracking-widest text-zinc-400 mt-2">
                Попълнете детайлите за клубната карта.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8">
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
