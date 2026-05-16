"use client";

import { useState, useEffect } from "react";
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReservationHistory } from "@/components/reservations/reservation-history";
import { History, LayoutGrid } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";

const COURT_COUNT = 6;

export default function ReservationsClient() {
  const { activeBranch } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                className="rounded-xl border-zinc-200 dark:border-zinc-800 h-11 px-5 font-bold text-[10px] uppercase tracking-widest bg-white dark:bg-zinc-900 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <ShieldAlert
                  className="mr-2.5 h-4 w-4 text-zinc-400"
                  strokeWidth={2}
                />
                Блокирай
              </Button>
            </BlockSlotDialog>
          )}
          <ReservationDialog onSave={handleSave}>
            <Button className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-11 px-6 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all border-none">
              <Plus className="mr-2.5 h-4 w-4" strokeWidth={2.5} /> Нова
              Резервация
            </Button>
          </ReservationDialog>
        </div>
      </PageHeader>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-3 pr-5 rounded-4xl border border-zinc-100 dark:border-zinc-900 shadow-sm shadow-black/2">
          <TabsList className="bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-3xl h-14 border border-zinc-200/50 dark:border-zinc-800/50">
            <TabsTrigger
              value="schedule"
              className="rounded-2xl px-6 h-full font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all flex items-center gap-2.5"
            >
              <LayoutGrid className="h-4 w-4" />
              График
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-2xl px-6 h-full font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all flex items-center gap-2.5"
            >
              <History className="h-4 w-4" />
              История
            </TabsTrigger>
          </TabsList>

          {activeTab === "schedule" && (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-center gap-4 border-r border-zinc-100 dark:border-zinc-900 pr-6">
                <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10">
                  <CalendarIcon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    {currentDate.toLocaleDateString("bg-BG", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                    {new Date().toDateString() ===
                      currentDate.toDateString() && (
                      <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        Днес
                      </span>
                    )}
                  </h2>
                </div>
              </div>

              <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 p-1 rounded-2xl gap-1 border border-zinc-100 dark:border-zinc-800">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousDay}
                  className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={goToToday}
                  className="px-6 h-10 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all"
                >
                  Днес
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextDay}
                  className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="schedule" className="mt-0 outline-none">
          <BentoCard className="overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-4xl shadow-sm shadow-black/2">
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
