"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { History, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { AgendaView } from "@/components/reservations/agenda-view";
import { BlockSlotDialog } from "@/components/reservations/block-slot-dialog";
import { ReservationDialog } from "@/components/reservations/reservation-dialog";
import { ReservationHistory } from "@/components/reservations/reservation-history";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/use-app-store";

const COURT_COUNT = 6;

export default function ReservationsClient() {
  const { activeBranch } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("schedule");

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

  const handleViewInCalendar = (date: Date) => {
    setCurrentDate(date);
    setActiveTab("schedule");
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-400 space-y-6 duration-700 animate-in fade-in slide-in-from-bottom-4">
      <PageHeader
        title="Резервации"
        description={
          activeBranch === "bkgalabovo"
            ? "Управление на кортовете и заетостта в реално време."
            : "Управление на резервации за възстановителни процедури в recoveryzone."
        }
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          {
            label: activeBranch === "bkgalabovo" ? "Клуб" : "Възстановяване",
            href: activeBranch === "bkgalabovo" ? "/dashboard" : "/recovery",
          },
          { label: "Резервации" },
        ]}
      >
        <div className="flex items-center gap-3">
          {activeBranch === "bkgalabovo" && (
            <BlockSlotDialog onSave={handleSave} courtCount={COURT_COUNT}>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-zinc-200 bg-white px-5 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <ShieldAlert
                  className="mr-2.5 size-4 text-zinc-400"
                  strokeWidth={2}
                />
                Блокирай
              </Button>
            </BlockSlotDialog>
          )}
          <ReservationDialog onSave={handleSave}>
            <Button className="h-11 rounded-xl border-none bg-primary px-6 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
              <Plus className="mr-2.5 size-4" strokeWidth={2.5} /> Нова
              Резервация на КОРТ
            </Button>
          </ReservationDialog>
        </div>
      </PageHeader>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex flex-col items-center justify-between gap-6 rounded-4xl border border-zinc-100 bg-white p-3 pr-5 shadow-sm shadow-black/2 md:flex-row dark:border-zinc-900 dark:bg-zinc-950">
          <TabsList className="h-14 rounded-3xl border border-zinc-200/50 bg-zinc-100/50 p-1 dark:border-zinc-800/50 dark:bg-zinc-900/50">
            <TabsTrigger
              value="schedule"
              className="flex h-full items-center gap-2.5 rounded-2xl px-6 text-[10px] font-bold tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
            >
              <LayoutGrid className="size-4" />
              График
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex h-full items-center gap-2.5 rounded-2xl px-6 text-[10px] font-bold tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
            >
              <History className="size-4" />
              История
            </TabsTrigger>
          </TabsList>

          {activeTab === "schedule" && (
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="flex items-center gap-4 border-r border-zinc-100 pr-6 dark:border-zinc-900">
                <div className="flex size-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-primary">
                  <CalendarIcon className="size-4" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                    {currentDate.toLocaleDateString("bg-BG", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                    {new Date().toDateString() ===
                      currentDate.toDateString() && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[8px] font-bold tracking-wider text-primary uppercase">
                        Днес
                      </span>
                    )}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-2xl border border-zinc-100 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousDay}
                  className="size-10 rounded-xl transition-all hover:bg-white hover:shadow-sm dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="size-4" strokeWidth={2} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={goToToday}
                  className="h-10 rounded-xl px-6 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-white hover:shadow-sm dark:hover:bg-zinc-800"
                >
                  Днес
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextDay}
                  className="size-10 rounded-xl transition-all hover:bg-white hover:shadow-sm dark:hover:bg-zinc-800"
                >
                  <ChevronRight className="size-4" strokeWidth={2} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="schedule" className="mt-0 outline-none">
          <BentoCard className="overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-sm shadow-black/2 dark:border-zinc-900 dark:bg-zinc-950">
            <div className="bg-white dark:bg-zinc-950">
              <AgendaView
                key={`${currentDate.toISOString()}-${refreshKey}`}
                refreshKey={refreshKey}
                date={currentDate}
                courtCount={COURT_COUNT}
              />
            </div>
          </BentoCard>
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none">
          <ReservationHistory onViewInCalendar={handleViewInCalendar} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
