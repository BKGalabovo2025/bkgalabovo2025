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
import { PlusCircle } from "lucide-react";
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

  // Use SWR for complex multi-source data fetching
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

    // Enrich subscriptions with member and service names using in-memory lookup
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
      mutate(); // Trigger SWR re-fetch
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
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Управление на абонаменти</CardTitle>
            <CardDescription>
              Преглед на всички абонаменти на членове.
            </CardDescription>
          </div>
          <Button onClick={() => openForm()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добави абонамент
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns(openForm)}
            data={subscriptions}
            isLoading={isLoading}
            filterColumnId="memberLastName"
            filterPlaceholder="Филтриране по фамилия..."
            emptyStateMessage="Все още няма добавени абонаменти."
          />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSubscription
                ? "Редакция на абонамент"
                : "Създаване на нов абонамент"}
            </DialogTitle>
            <DialogDescription>
              {selectedSubscription
                ? "Променете данните и запазете."
                : "Попълнете формата, за да създадете нов абонамент."}
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
};

export default SubscriptionsPage;
