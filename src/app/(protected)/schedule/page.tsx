"use client";

import React, { useState, useMemo } from "react";
import { useEvents } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import { PlusCircle, Repeat, Loader2 } from "lucide-react";
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

export default function SchedulePage() {
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight font-heading text-zinc-900 dark:text-white">
            График и Събития
          </h1>
          <p className="text-muted-foreground text-lg">Планирайте тренировки, лагери и състезания на клуба.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setMonthlyDialogOpen(true)} className="h-11 px-6 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
            <Repeat className="mr-2 h-4 w-4 text-zinc-400" />
            Шаблонен график
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all font-bold">
            <PlusCircle className="mr-2 h-4 w-4" />
            Създай събитие
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 h-11 border border-zinc-200 dark:border-zinc-700">
            <TabsTrigger value="current" className="rounded-xl px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 font-bold font-heading transition-all">Текущи</TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-xl px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 font-bold font-heading transition-all">Предстоящи</TabsTrigger>
            <TabsTrigger value="past" className="rounded-xl px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 font-bold font-heading transition-all">Минали</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="w-full md:w-[280px]">
          <Select
            onValueChange={(value) =>
              setFilterType(value as ScheduleEventType | "all")
            }
            defaultValue="all"
          >
            <SelectTrigger className="h-11 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold">
              <SelectValue placeholder="Филтрирай по тип" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <SelectItem value="all">Всички типове</SelectItem>
              {Object.entries(eventTypeTranslations).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6">
        <Tabs value={activeTab} className="w-full m-0 p-0">
          <TabsContent value="current" className="mt-0">
            {renderEventsList(filteredEvents, isLoading, errorObject)}
          </TabsContent>
          <TabsContent value="upcoming" className="mt-0">
            {renderEventsList(filteredEvents, isLoading, errorObject)}
          </TabsContent>
          <TabsContent value="past" className="mt-0">
            {renderEventsList(
              paginatedEvents,
              isLoading,
              errorObject,
              filteredEvents.length
            )}
          </TabsContent>
        </Tabs>
      </div>

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
        <AlertDialogContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl">
              Изтриване на събитие
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Сигурни ли сте, че искате да премахнете това събитие от графика? Това действие не може да бъде отменено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl">Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-red-500 hover:bg-red-600 font-bold"
            >
              Изтрий събитието
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  function renderEventsList(
    eventsToShow: ScheduleEvent[],
    isLoading: boolean,
    error: Error | null,
    totalEvents?: number
  ) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-32 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <p className="text-muted-foreground font-medium font-heading">Зареждане на събития...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
          <p className="text-red-500 font-bold">
            Грешка при зареждане: {error.message}
          </p>
        </div>
      );
    }

    const finalTotalEvents = totalEvents ?? eventsToShow.length;

    if (finalTotalEvents === 0) {
      return (
        <div className="text-center py-32 bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <PlusCircle className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
          <h3 className="text-xl font-bold font-heading">
            {filterType === "all"
              ? `Няма ${tabTranslations[activeTab]} събития`
              : `Няма ${tabTranslations[activeTab]} събития от тип "${eventTypeTranslations[filterType as ScheduleEventType]}"`}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium">
            Променете филтрите или планирайте ново събитие за този период.
          </p>
        </div>
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
                <h2 className="text-2xl font-black font-heading capitalize text-zinc-900 dark:text-white">{month}</h2>
                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <div className="grid gap-3">
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
          <div className="flex justify-center items-center gap-6 py-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-xl font-bold border-zinc-200 dark:border-zinc-800"
            >
              Предишна
            </Button>
            <span className="font-bold font-heading text-zinc-500">
              Страница {currentPage} от{" "}
              {Math.ceil(finalTotalEvents / EVENTS_PER_PAGE)}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage * EVENTS_PER_PAGE >= finalTotalEvents}
              className="rounded-xl font-bold border-zinc-200 dark:border-zinc-800"
            >
              Следваща
            </Button>
          </div>
        )}
      </div>
    );
  }
}
