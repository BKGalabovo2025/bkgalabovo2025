"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgendaView } from "@/components/reservations/agenda-view";
import { ReservationDialog } from "@/components/reservations/reservation-dialog";
import { BlockSlotDialog } from "@/components/reservations/block-slot-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  ShieldAlert,
} from "lucide-react";

const COURT_COUNT = 6;

export default function ReservationsClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSave = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Резервации"
        description="График на кортовете и управление на заетостта в реално време."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Резервации" },
        ]}
      >
        <div className="flex items-center gap-3">
          <BlockSlotDialog onSave={handleSave} courtCount={COURT_COUNT}>
            <Button variant="outline" className="rounded-xl border-slate-200">
              <ShieldAlert className="mr-2 h-4 w-4" /> Блокирай
            </Button>
          </BlockSlotDialog>
          <ReservationDialog onSave={handleSave}>
            <Button className="rounded-xl shadow-md font-bento">
              <Plus className="mr-2 h-4 w-4" /> Нова резервация
            </Button>
          </ReservationDialog>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Date Selector Bento */}
        <BentoCard className="md:col-span-12 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                Текуща дата
              </p>
              <p className="text-xl font-black font-bento">
                {currentDate.toLocaleDateString("bg-BG", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousDay}
              className="rounded-xl hover:bg-white hover:shadow-sm transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={goToToday}
              className="px-6 font-bold rounded-xl hover:bg-white hover:shadow-sm transition-all"
            >
              Днес
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextDay}
              className="rounded-xl hover:bg-white hover:shadow-sm transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </BentoCard>

        {/* Schedule Bento */}
        <BentoCard className="md:col-span-12 overflow-hidden border-none shadow-xl">
          <div className="bg-white dark:bg-zinc-950">
            <AgendaView
              refreshKey={refreshKey}
              date={currentDate}
              courtCount={COURT_COUNT}
            />
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
