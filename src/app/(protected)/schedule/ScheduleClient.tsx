"use client";

import React, { useState, useMemo } from "react";
import { useEvents } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Repeat,
  Loader2,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { CreateEventDialog } from "@/components/schedule/CreateEventDialog";
import { EditEventDialog } from "@/components/schedule/EditEventDialog";
import { AttendeesDialog } from "@/components/schedule/AttendeesDialog";
import { MonthlyScheduleDialog } from "@/components/schedule/MonthlyScheduleDialog";
import { PrintableEvent } from "@/components/schedule/PrintableEvent";
import { ScheduleEvent, Member, ScheduleEventType, Attendee } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventListItem } from "@/components/schedule/EventListItem";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";

const eventTypeTranslations: Record<ScheduleEventType, string> = {
  training: "Тренировка",
  competition: "Състезание",
  camp: "Лагер",
  event: "Събитие",
  other: "Друго",
};

const tabTranslations: Record<string, string> = {
  current: "текущи",
  upcoming: "предстоящи",
  past: "минали",
};

const EVENTS_PER_PAGE = 20;

export default function ScheduleClient() {
  const {
    events,
    members,
    addEvent,
    addMultipleEvents,
    updateEvent,
    deleteEvent,
    updateAttendees,
    isLoading,
    error,
  } = useEvents();

  const [activeTab, setActiveTab] = useState("current");
  const [filterType, setFilterType] = useState<ScheduleEventType | "all">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isAttendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isMonthlyDialogOpen, setMonthlyDialogOpen] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(
    null
  );
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const triggerPrint = async (event: ScheduleEvent) => {
    const { renderToString } = await import("react-dom/server");
    const printableComponent = (
      <PrintableEvent
        event={event}
        members={members as Member[]}
        eventTypeTranslations={eventTypeTranslations}
      />
    );
    const printContent = renderToString(printableComponent);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Грешка при принтиране", {
        description: "Прозорецът за печат е блокиран от браузъра.",
      });
      return;
    }
    const styles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    );
    const stylesHTML = styles.map((style) => style.outerHTML).join("");
    printWindow.document.write(
      `<html><head><title>Печат на събитие</title>${stylesHTML}</head><body style="margin: 20px;">${printContent}</body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleAddEvent = async (
    newEvent: Omit<ScheduleEvent, "id" | "color">
  ) => {
    await addEvent(newEvent as ScheduleEvent);
  };

  const handleGenerateMonthly = async (
    newEvents: Omit<ScheduleEvent, "id">[]
  ) => {
    await addMultipleEvents(newEvents as ScheduleEvent[]);
  };

  const handleUpdateEvent = async (
    eventId: string,
    eventData: Partial<ScheduleEvent>
  ) => {
    await updateEvent(eventId, eventData);
  };

  const handleUpdateAttendees = async (
    eventId: string,
    attendees: Attendee[]
  ) => {
    await updateAttendees(eventId, attendees);
  };

  const openEditDialog = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const openAttendeesDialog = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setAttendeesDialogOpen(true);
  };

  const openDeleteDialog = (eventId: string) => {
    setEventToDeleteId(eventId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (eventToDeleteId) {
      await deleteEvent(eventToDeleteId);
    }
    setDeleteDialogOpen(false);
    setEventToDeleteId(null);
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );
    endOfCurrentMonth.setHours(23, 59, 59, 999);

    const filtered = (events || [])
      .filter(
        (event) =>
          event.startDate && !isNaN(new Date(event.startDate).getTime())
      )
      .filter((event) => {
        if (filterType !== "all" && event.type !== filterType) return false;

        const eventDate = new Date(event.startDate);
        switch (activeTab) {
          case "current":
            return (
              eventDate >= startOfCurrentMonth && eventDate <= endOfCurrentMonth
            );
          case "upcoming":
            return eventDate > endOfCurrentMonth;
          case "past":
            return eventDate < startOfCurrentMonth;
          default:
            return true;
        }
      });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return activeTab === "past" ? dateB - dateA : dateA - dateB;
    });
  }, [events, activeTab, filterType]);

  const paginatedEvents = useMemo(() => {
    if (activeTab !== "past") return filteredEvents;
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + EVENTS_PER_PAGE;
    return filteredEvents.slice(startIndex, endIndex);
  }, [filteredEvents, currentPage, activeTab]);

  let errorObject: Error | null = null;
  if (error) {
    if (typeof error === "string") {
      errorObject = new Error(error);
    } else {
      errorObject = error;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="График"
        description="Управление на тренировъчни графици, състезания и клубни събития."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "График" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setMonthlyDialogOpen(true)}
            className="rounded-xl shadow-sm font-bento bg-white"
          >
            <Repeat className="mr-2 h-4 w-4" /> Шаблонен график
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-xl shadow-md font-bento"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Създай събитие
          </Button>
        </div>
      </PageHeader>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        defaultValue="current"
        className="w-full"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <TabsList className="bg-slate-100 p-1 rounded-2xl w-full md:w-fit">
            <TabsTrigger
              value="current"
              className="rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2.5"
            >
              Текущи
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2.5"
            >
              Предстоящи
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2.5"
            >
              Минали
            </TabsTrigger>
          </TabsList>

          <div className="w-full md:w-[280px] flex items-center gap-2">
            <div className="p-2.5 bg-slate-100 rounded-xl">
              <Filter className="h-4 w-4 text-slate-500" />
            </div>
            <Select
              onValueChange={(value) =>
                setFilterType(value as ScheduleEventType | "all")
              }
              defaultValue="all"
            >
              <SelectTrigger className="rounded-xl border-slate-100 shadow-sm font-medium">
                <SelectValue placeholder="Филтрирай по тип" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all" className="rounded-lg">
                  Всички типове
                </SelectItem>
                {Object.entries(eventTypeTranslations).map(([key, value]) => (
                  <SelectItem key={key} value={key} className="rounded-lg">
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                Зареждане на събития...
              </p>
            </div>
          ) : errorObject ? (
            <div className="text-center py-32 text-rose-500 flex flex-col items-center">
              <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-bold text-lg">Грешка при зареждане</p>
              <p className="text-slate-400 text-sm mt-1">
                {errorObject.message}
              </p>
            </div>
          ) : (
            <>
              {activeTab === "current" && renderEventsList(filteredEvents)}
              {activeTab === "upcoming" && renderEventsList(filteredEvents)}
              {activeTab === "past" &&
                renderEventsList(paginatedEvents, filteredEvents.length)}
            </>
          )}
        </div>
      </Tabs>

      {/* Dialogs */}
      <CreateEventDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onAddEvent={handleAddEvent}
      />
      <EditEventDialog
        isOpen={isEditDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        event={selectedEvent}
        onUpdateEvent={handleUpdateEvent}
      />
      <AttendeesDialog
        isOpen={isAttendeesDialogOpen}
        onClose={() => setAttendeesDialogOpen(false)}
        event={selectedEvent}
        onUpdateAttendees={handleUpdateAttendees}
        members={members as Member[]}
      />
      <MonthlyScheduleDialog
        isOpen={isMonthlyDialogOpen}
        onClose={() => setMonthlyDialogOpen(false)}
        onGenerate={handleGenerateMonthly}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black font-bento">
              Наистина ли искате да изтриете това събитие?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-500">
              Това действие не може да бъде отменено. Записът ще бъде премахнат
              окончателно от базата данни.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-bold shadow-lg shadow-rose-100"
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  function renderEventsList(
    eventsToShow: ScheduleEvent[],
    totalEvents?: number
  ) {
    const finalTotalEvents = totalEvents ?? eventsToShow.length;

    if (finalTotalEvents === 0) {
      return (
        <BentoCard className="flex flex-col items-center justify-center py-32 text-center border-dashed border-2 border-slate-100 bg-transparent shadow-none">
          <CalendarDays className="h-16 w-16 text-slate-100 mb-6" />
          <h3 className="text-2xl font-black font-bento text-slate-300">
            {filterType === "all"
              ? `Няма ${tabTranslations[activeTab]} събития`
              : `Няма ${tabTranslations[activeTab]} събития от тип "${eventTypeTranslations[filterType as ScheduleEventType]}"`}
          </h3>
          <p className="text-slate-400 mt-2 font-medium max-w-md">
            Можете да промените филтрите или да създадете ново събитие, за да
            започнете.
          </p>
        </BentoCard>
      );
    }

    const groupedEvents = (eventsToShow || []).reduce(
      (acc: Record<string, ScheduleEvent[]>, event: ScheduleEvent) => {
        const month = new Date(event.startDate).toLocaleString("bg-BG", {
          month: "long",
          year: "numeric",
        });
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(event);
        return acc;
      },
      {}
    );

    return (
      <div className="space-y-12">
        <div className="space-y-10">
          {Object.entries(groupedEvents).map(([month, monthEvents]) => (
            <div key={month} className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex-shrink-0">
                  {month}
                </h2>
                <div className="h-px w-full bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {(monthEvents as ScheduleEvent[]).map(
                  (event: ScheduleEvent) => (
                    <EventListItem
                      key={event.id}
                      event={event}
                      members={members as Member[]}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                      onManageAttendees={openAttendeesDialog}
                      onPrint={triggerPrint}
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {activeTab === "past" && finalTotalEvents > EVENTS_PER_PAGE && (
          <div className="flex justify-center items-center gap-6 mt-12 bg-white p-4 rounded-2xl shadow-sm w-fit mx-auto border border-slate-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-xl h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="font-black text-xs uppercase tracking-widest text-slate-500">
              Страница {currentPage}{" "}
              <span className="text-slate-200 mx-2">/</span>{" "}
              {Math.ceil(finalTotalEvents / EVENTS_PER_PAGE)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage * EVENTS_PER_PAGE >= finalTotalEvents}
              className="rounded-xl h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    );
  }
}
