"use client";

import { ArrowLeft, Edit3, Printer, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { BusinessTripManagerDialog } from "@/components/business-trips/BusinessTripManagerDialog";
import { CreateBusinessTripDialog } from "@/components/business-trips/CreateBusinessTripDialog";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/date-utils";
import { ScheduleEvent } from "@/types";
import { BusinessTrip, TripExpense } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";

import { TripDetailsProvider, useTripDetails } from "./TripDetailsContext";
import { TripDetailsNav } from "./TripDetailsNav";

function TripDetailsHeaderInner({ tripId }: { tripId: string }) {
  const { trip, event, membersDict, refreshData } = useTripDetails();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);

  const effectiveEvent: ScheduleEvent =
    event ||
    ({
      id: trip.eventId || trip.id || "event",
      title: trip.title,
      startDate: trip.startDate,
      endDate: trip.endDate,
      type: "competition",
      siteId: trip.siteId,
      description: trip.destination,
      location: trip.destination || "",
      attendees: [],
      attendeeMemberIds: [],
    } as unknown as ScheduleEvent);

  const coach = trip.coachId ? membersDict[trip.coachId] : null;
  const coachName = coach
    ? `${coach.firstName} ${coach.lastName}`
    : trip.coachName || "Не е избран";

  const getStatusBadge = () => {
    switch (trip.status) {
      case "approved":
        return (
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
          >
            Одобрена
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
          >
            Отчетена
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
          >
            Чернова
          </Badge>
        );
    }
  };

  return (
    <>
      <PageHeader
        title={
          <div className="flex flex-wrap items-center gap-3">
            <span>{trip.title}</span>
            {getStatusBadge()}
          </div>
        }
        description={`Дестинация: ${trip.destination} • Период: ${formatDateShort(
          trip.startDate
        )} – ${formatDateShort(trip.endDate)} • Ръководител: ${coachName}`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Счетоводство", href: "/accounting" },
          { label: trip.title },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
          >
            <Link href="/accounting" title="Обратно към счетоводния дневник">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Към отчетите
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            title="Редактирай параметри на командировката (дати, дестинация, покритие на разходи, МПС)"
          >
            <Edit3 className="mr-1.5 size-3.5 text-blue-600 dark:text-blue-400" />
            Редактирай данни
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManagerDialogOpen(true)}
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            title="Отвори пълния мениджър с всички бланки, ведомост и подписи"
          >
            <SlidersHorizontal className="mr-1.5 size-3.5 text-indigo-600 dark:text-indigo-400" />
            Пълен мениджър
          </Button>

          <Button
            asChild
            size="sm"
            className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
          >
            <Link href={`/accounting/trips/${tripId}/order`}>
              <Printer className="mr-1.5 size-3.5" />
              Печат Заповед
            </Link>
          </Button>
        </div>
      </PageHeader>

      <TripDetailsNav tripId={tripId} />

      {isEditDialogOpen && (
        <CreateBusinessTripDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          event={effectiveEvent}
          initialData={trip}
          membersDict={membersDict}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            refreshData();
          }}
        />
      )}

      {isManagerDialogOpen && (
        <BusinessTripManagerDialog
          event={effectiveEvent}
          open={isManagerDialogOpen}
          onOpenChange={(open) => {
            setIsManagerDialogOpen(open);
            if (!open) {
              refreshData();
            }
          }}
        />
      )}
    </>
  );
}

export function TripDetailsLayoutClient({
  tripId,
  initialTrip,
  initialEvent,
  initialExpenses,
  initialMembersDict,
  children,
}: {
  tripId: string;
  initialTrip: BusinessTrip;
  initialEvent: ScheduleEvent | null;
  initialExpenses: TripExpense[];
  initialMembersDict: Record<string, Member>;
  children: React.ReactNode;
}) {
  return (
    <TripDetailsProvider
      initialTrip={initialTrip}
      initialEvent={initialEvent}
      initialExpenses={initialExpenses}
      initialMembersDict={initialMembersDict}
    >
      <div className="space-y-6 pb-24 duration-700 animate-in fade-in">
        <TripDetailsHeaderInner tripId={tripId} />
        <main className="space-y-6">{children}</main>
      </div>
    </TripDetailsProvider>
  );
}
