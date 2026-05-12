"use client";

import { useState } from "react";
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
        <div className="flex items-center gap-4">
          <BlockSlotDialog onSave={handleSave} courtCount={COURT_COUNT}>
            <Button
              variant="outline"
              className="rounded-xl border-zinc-200 dark:border-zinc-800 h-12 px-6 font-medium text-[11px] uppercase tracking-widest bg-white dark:bg-zinc-900 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <ShieldAlert className="mr-3 h-4 w-4" strokeWidth={1.5} />{" "}
              Блокирай
            </Button>
          </BlockSlotDialog>
          <ReservationDialog onSave={handleSave}>
            <Button className="rounded-xl font-medium uppercase tracking-widest text-[11px] h-12 px-8 bg-primary text-white hover:bg-primary/90 shadow-none transition-all">
              <Plus className="mr-3 h-4 w-4" strokeWidth={1.5} /> Нова
              резервация
            </Button>
          </ReservationDialog>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Date Selector Bento */}
        <BentoCard className="md:col-span-12 p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-2xl shadow-none">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
              <CalendarIcon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-1">
                Текуща дата
              </p>
              <p className="text-2xl font-light text-zinc-900 dark:text-white">
                {currentDate.toLocaleDateString("bg-BG", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-2xl gap-2 border border-zinc-100 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousDay}
              className="h-12 w-12 rounded-xl hover:bg-white dark:hover:bg-zinc-800 hover:shadow-none transition-all"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              onClick={goToToday}
              className="px-8 h-12 font-medium text-[11px] uppercase tracking-widest rounded-xl hover:bg-white dark:hover:bg-zinc-800 hover:shadow-none transition-all"
            >
              Днес
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextDay}
              className="h-12 w-12 rounded-xl hover:bg-white dark:hover:bg-zinc-800 hover:shadow-none transition-all"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </div>
        </BentoCard>

        {/* Schedule Bento */}
        <BentoCard className="md:col-span-12 overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-4xl shadow-none">
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
