"use client";

import {
  FileCheck2,
  FileText,
  PenTool,
  Printer,
  Receipt,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { BusinessTripManagerDialog } from "@/components/business-trips/BusinessTripManagerDialog";
import { CreateBusinessTripDialog } from "@/components/business-trips/CreateBusinessTripDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScheduleEvent } from "@/types";

import { useTripDetails } from "../TripDetailsContext";

export function TripManageView() {
  const { trip, event, membersDict, refreshData } = useTripDetails();
  const [isManagerOpen, setIsManagerOpen] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

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

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold sm:text-lg flex items-center gap-2">
                <SlidersHorizontal className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  Управление на командировка № {trip.orderNumber || "—"}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Решение на УС: <strong>{trip.usDecision || "—"}</strong> •
                Протокол: <strong>{trip.usProtocolNumber || "—"}</strong>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditOpen(true)}
                className="h-8 rounded-xl text-xs font-semibold"
              >
                Редактирай параметри
              </Button>
              <Button
                size="sm"
                onClick={() => setIsManagerOpen(true)}
                className="h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white"
              >
                <SlidersHorizontal className="mr-1.5 size-3.5" />
                Отвори мениджър
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Link
              href={`/accounting/trips/${trip.id}/order`}
              className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-blue-300 hover:bg-blue-50/40 transition-all dark:border-zinc-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <Printer className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Заповед за командировка
                </p>
                <p className="text-[11px] text-muted-foreground">
                  № {trip.orderNumber || "—"}
                </p>
              </div>
            </Link>

            <Link
              href={`/accounting/trips/${trip.id}/protocol`}
              className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all dark:border-zinc-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <FileCheck2 className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Решение на УС
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {trip.usDecision || "—"}
                </p>
              </div>
            </Link>

            <Link
              href={`/accounting/trips/${trip.id}/athletes`}
              className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-purple-300 hover:bg-purple-50/40 transition-all dark:border-zinc-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/20"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <PenTool className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Подписи на състезатели
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {trip.participantsIds?.length || 0} състезатели
                </p>
              </div>
            </Link>

            <Link
              href={`/accounting/trips/${trip.id}/expenses`}
              className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-amber-300 hover:bg-amber-50/40 transition-all dark:border-zinc-800 dark:hover:border-amber-700 dark:hover:bg-amber-950/20"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Receipt className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Разходи & Фактури
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Пълен финансов опис
                </p>
              </div>
            </Link>

            <Link
              href={`/accounting/trips/${trip.id}/report`}
              className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-teal-300 hover:bg-teal-50/40 transition-all dark:border-zinc-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/20"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                <FileText className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Доклад за командировка
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Отчет на ръководителя
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {isManagerOpen && (
        <BusinessTripManagerDialog
          event={effectiveEvent}
          initialTripId={trip.id}
          open={isManagerOpen}
          onOpenChange={(open) => {
            setIsManagerOpen(open);
            if (!open) {
              refreshData();
            }
          }}
        />
      )}

      {isEditOpen && (
        <CreateBusinessTripDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          event={effectiveEvent}
          initialData={trip}
          membersDict={membersDict}
          onSuccess={() => {
            setIsEditOpen(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
