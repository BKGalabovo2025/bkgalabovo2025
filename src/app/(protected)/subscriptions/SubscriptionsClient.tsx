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
          className="rounded-xl shadow-md font-bento"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Добави абонамент
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <BentoCard className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-black">{subscriptions.length}</p>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                Общо карти
              </p>
            </div>
            <CreditCard className="h-5 w-5 text-primary/50" />
          </div>
        </BentoCard>
        <BentoCard className="p-6 border-emerald-100 bg-emerald-50/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-black text-emerald-600">
                {activeCount}
              </p>
              <p className="text-xs text-emerald-600/50 uppercase font-bold tracking-wider">
                Активни
              </p>
            </div>
            <UserCheck className="h-5 w-5 text-emerald-500/50" />
          </div>
        </BentoCard>
        <BentoCard className="md:col-span-2 p-6 flex items-center bg-slate-900 text-white border-none shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl">
              <AlertCircle className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-white/50 font-bold uppercase tracking-widest text-[10px]">
                Важно съобщение
              </p>
              <p className="text-lg font-bold">Изтичащи абонаменти</p>
              <p className="text-xs text-white/40">
                Проверете картите, които изтичат през следващите 7 дни.
              </p>
            </div>
          </div>
        </BentoCard>
      </div>

      <BentoCard className="p-0 overflow-hidden border-none shadow-md">
        <div className="p-6">
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
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black font-bento">
              {selectedSubscription ? "Редакция на абонамент" : "Нов абонамент"}
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Попълнете детайлите за клубната карта.
            </DialogDescription>
          </DialogHeader>
          <SubscriptionForm
            members={members}
            services={services}
            onSave={handleSave}
            onClose={() => setIsFormOpen(false)}
            initialData={selectedSubscription}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
