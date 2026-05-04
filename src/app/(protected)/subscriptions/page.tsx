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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Repeat } from "lucide-react";
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

const SubscriptionsPage = () => {
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

  const { data, error, isLoading, mutate } = useSWR(
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

  useEffect(() => {
    if (error) {
      console.error("Error fetching subscription data:", error);
      toast.error("Грешка при зареждане на данните", {
        description: "Възникна проблем при извличането на абонаментите.",
      });
    }
  }, [error]);

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
        description:
          "За да извършите това действие, трябва да сте влезли в системата.",
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
      toast.error("Грешка при записа", {
        description: "Възникна проблем при запис на абонамента.",
      });
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tight font-heading text-zinc-900 dark:text-white flex items-center gap-4">
            <Repeat className="h-12 w-12 text-blue-600" />
            Абонаменти
          </h1>
          <p className="text-zinc-500 text-lg font-medium">Управление на активните услуги и периодични членства.</p>
        </div>
        <Button onClick={() => openForm()} className="h-12 px-10 rounded-[1.25rem] bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-black text-xs uppercase tracking-[0.15em] hover:scale-[1.02] transition-all shadow-xl shadow-zinc-900/20">
          <PlusCircle className="mr-2 h-5 w-5" /> Добави абонамент
        </Button>
      </div>

      <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden transition-all p-4">
        <DataTable
          columns={columns(openForm)}
          data={subscriptions}
          isLoading={isLoading}
          filterColumnId="memberLastName"
          filterPlaceholder="Търсене по фамилия..."
          emptyStateMessage="Все още няма записани абонаменти."
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900">
          <DialogHeader className="bg-zinc-50 dark:bg-zinc-800/50 px-10 py-10">
            <DialogTitle className="font-heading font-black text-3xl text-zinc-900 dark:text-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Repeat className="h-5 w-5 text-white" />
              </div>
              {selectedSubscription ? "Редакция" : "Нов абонамент"}
            </DialogTitle>
            <DialogDescription className="text-base text-zinc-500 font-medium">
              {selectedSubscription
                ? "Актуализирайте информацията за членския абонамент."
                : "Конфигурирайте параметрите на новия абонамент."}
            </DialogDescription>
          </DialogHeader>
          <div className="px-10 py-10">
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
};

export default SubscriptionsPage;
