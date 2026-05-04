"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Lock, Plus, Settings2, LayoutGrid, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlockSlotDialog } from "@/components/reservations/block-slot-dialog";
import { ReservationDialog } from "@/components/reservations/reservation-dialog";
import { AgendaView } from "@/components/reservations/agenda-view";
import { WorkingHoursDialog } from "@/components/reservations/working-hours-dialog";
import { ReservationHistory } from "@/components/reservations/reservation-history";
import { cn } from "@/lib/utils";

const ReservationsPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<"schedule" | "history">("schedule");
  const COURT_COUNT = 6;

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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-zinc-100 dark:border-zinc-800 pb-10">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-10 bg-blue-600 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Система за резервации</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight font-heading text-zinc-900 dark:text-white">
              {view === "schedule" ? "График на кортовете" : "История на резервациите"}
            </h1>
            <p className="text-zinc-500 text-lg font-medium max-w-xl">
              {view === "schedule" 
                ? "Пълен контрол върху натовареността и резервациите на вашия клуб в реално време."
                : "Пълен архив на всички направени резервации, плащания и клиентски данни."}
            </p>
          </div>

          {/* View Switcher */}
          <div className="flex p-1 bg-zinc-100/80 dark:bg-zinc-800/50 rounded-2xl w-fit border border-zinc-200/50 dark:border-zinc-700/50">
            <button
              onClick={() => setView("schedule")}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                view === "schedule" 
                  ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              График
            </button>
            <button
              onClick={() => setView("history")}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                view === "history" 
                  ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <History className="h-3.5 w-3.5" />
              История
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {view === "schedule" && (
            <>
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="rounded-xl h-10 w-10 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={goToToday} className="rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  Днес
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNextDay} className="rounded-xl h-10 w-10 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

              <div className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm min-w-[200px] justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-black font-heading text-sm text-zinc-900 dark:text-zinc-100">
                  {currentDate.toLocaleDateString("bg-BG", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />
            </>
          )}

          <div className="flex items-center gap-2">
            {view === "schedule" && (
              <>
                <WorkingHoursDialog onSave={handleSave}>
                  <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-zinc-200 hover:bg-white dark:border-zinc-800 dark:hover:bg-zinc-800" title="Настройки на работно време">
                    <Settings2 className="h-4 w-4 text-zinc-400" />
                  </Button>
                </WorkingHoursDialog>
                <BlockSlotDialog onSave={handleSave} courtCount={COURT_COUNT}>
                  <Button variant="outline" className="h-11 rounded-xl border-zinc-200 hover:bg-white dark:border-zinc-800 dark:hover:bg-zinc-800 font-black text-[10px] uppercase tracking-widest">
                    <Lock className="mr-2 h-4 w-4 text-zinc-400" /> Блокирай
                  </Button>
                </BlockSlotDialog>
              </>
            )}
            <ReservationDialog onSave={handleSave}>
              <Button className="h-11 px-6 rounded-xl bg-zinc-900 text-white dark:bg-blue-600 dark:hover:bg-blue-700 shadow-xl shadow-zinc-900/20 dark:shadow-blue-500/20 transition-all font-black text-[10px] uppercase tracking-widest">
                <Plus className="mr-2 h-4 w-4" /> Нова резервация
              </Button>
            </ReservationDialog>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative">
        {view === "schedule" ? (
          <AgendaView
            refreshKey={refreshKey}
            date={currentDate}
            courtCount={COURT_COUNT}
          />
        ) : (
          <ReservationHistory />
        )}
      </div>
    </div>
  );
};

export default ReservationsPage;
