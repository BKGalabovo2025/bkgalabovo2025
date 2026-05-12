"use client";

import { useState, useMemo } from "react";
import { useEvents } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Repeat,
  Loader2,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const membersMap = useMemo(() => {
    const map: Record<string, Member> = {};
    (members as Member[]).forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, [members]);

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

  const groupedEvents = useMemo(() => {
    const eventsToGroup =
      activeTab === "past" ? paginatedEvents : filteredEvents;
    return (eventsToGroup || []).reduce(
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
  }, [filteredEvents, paginatedEvents, activeTab]);

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
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => setMonthlyDialogOpen(true)}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 h-12 px-6 font-medium text-[11px] uppercase tracking-widest bg-white dark:bg-zinc-900 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-none"
          >
            <Repeat className="mr-3 h-4 w-4" strokeWidth={1.5} /> Шаблонен
            график
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-xl font-medium uppercase tracking-widest text-[11px] h-12 px-8 bg-primary text-white hover:bg-primary/90 shadow-none transition-all"
          >
            <PlusCircle className="mr-3 h-4 w-4" strokeWidth={1.5} /> Създай
            събитие
          </Button>
        </div>
      </PageHeader>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        defaultValue="current"
        className="w-full"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-full md:w-fit border border-zinc-100 dark:border-zinc-800">
            <TabsTrigger
              value="current"
              className="rounded-xl px-8 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
            >
              Текущи
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="rounded-xl px-8 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
            >
              Предстоящи
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-xl px-8 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
            >
              Минали
            </TabsTrigger>
          </TabsList>

          <div className="w-full md:w-[300px] flex items-center gap-3">
            <div className="h-12 w-12 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <Filter className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
            </div>
            <Select
              onValueChange={(value) =>
                setFilterType(value as ScheduleEventType | "all")
              }
              defaultValue="all"
            >
              <SelectTrigger className="h-12 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-none font-light text-sm focus:ring-primary">
                <SelectValue placeholder="Филтрирай по тип" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-100 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-950">
                <SelectItem
                  value="all"
                  className="rounded-lg text-sm font-light"
                >
                  Всички типове
                </SelectItem>
                {Object.entries(eventTypeTranslations).map(([key, value]) => (
                  <SelectItem
                    key={key}
                    value={key}
                    className="rounded-lg text-sm font-light"
                  >
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
              <Loader2
                className="h-12 w-12 animate-spin text-primary opacity-20"
                strokeWidth={1}
              />
              <p className="text-zinc-400 font-medium uppercase tracking-[0.2em] text-[10px]">
                Зареждане на събития...
              </p>
            </div>
          ) : errorObject ? (
            <div className="text-center py-40 text-rose-500 flex flex-col items-center">
              <AlertTriangle
                className="h-12 w-12 mb-6 opacity-20"
                strokeWidth={1}
              />
              <p className="font-light text-2xl text-zinc-900 dark:text-white">
                Грешка при зареждане
              </p>
              <p className="text-zinc-400 text-sm mt-2 font-light">
                {errorObject.message}
              </p>
            </div>
          ) : (
            <>
              {activeTab === "current" &&
                renderEventsList(filteredEvents, groupedEvents)}
              {activeTab === "upcoming" &&
                renderEventsList(filteredEvents, groupedEvents)}
              {activeTab === "past" &&
                renderEventsList(
                  paginatedEvents,
                  groupedEvents,
                  filteredEvents.length
                )}
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
        <AlertDialogContent className="rounded-4xl border-none shadow-none bg-white dark:bg-zinc-950 p-10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-light text-zinc-900 dark:text-white leading-tight">
              Наистина ли искате да изтриете това събитие?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-light text-zinc-400 text-sm mt-4 leading-relaxed">
              Това действие не може да бъде отменено. Записът ще бъде премахнат
              окончателно от базата данни.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-3">
            <AlertDialogCancel className="rounded-xl font-medium text-[11px] uppercase tracking-widest h-12 px-6 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-medium text-[11px] uppercase tracking-widest h-12 px-8 shadow-none"
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
    grouped: Record<string, ScheduleEvent[]>,
    totalEvents?: number
  ) {
    const finalTotalEvents = totalEvents ?? eventsToShow.length;

    if (finalTotalEvents === 0) {
      return (
        <BentoCard className="flex flex-col items-center justify-center py-40 text-center border-dashed border-2 border-zinc-100 dark:border-zinc-900 rounded-5xl bg-zinc-50/30 dark:bg-zinc-900/10 shadow-none">
          <div className="h-32 w-32 rounded-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-10 transition-all hover:scale-105">
            <CalendarDays
              className="h-12 w-12 text-zinc-200 dark:text-zinc-700"
              strokeWidth={1}
            />
          </div>
          <h3 className="text-3xl font-light text-zinc-900 dark:text-white">
            {filterType === "all"
              ? `Няма ${tabTranslations[activeTab]} събития`
              : `Няма ${tabTranslations[activeTab]} събития от тип "${eventTypeTranslations[filterType as ScheduleEventType]}"`}
          </h3>
          <p className="text-zinc-400 mt-4 font-light max-w-sm leading-relaxed">
            Можете да промените филтрите или да създадете ново събитие, за да
            започнете.
          </p>
        </BentoCard>
      );
    }

    return (
      <div className="space-y-12">
        <div className="space-y-10">
          {Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month} className="space-y-8">
              <div className="flex items-center gap-6 px-1">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.4em] text-zinc-400 shrink-0">
                  {month}
                </h2>
                <div className="h-px w-full bg-zinc-100 dark:bg-zinc-900"></div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {(monthEvents as ScheduleEvent[]).map(
                  (event: ScheduleEvent) => (
                    <EventListItem
                      key={event.id}
                      event={event}
                      members={members as Member[]}
                      membersMap={membersMap}
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
          <div className="flex justify-center items-center gap-8 mt-16 bg-white dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-900 w-fit mx-auto shadow-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-xl h-12 w-12 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </Button>
            <span className="font-medium text-[11px] uppercase tracking-widest text-zinc-400 px-4">
              Страница {currentPage}{" "}
              <span className="text-zinc-200 dark:text-zinc-800 mx-4">/</span>{" "}
              {Math.ceil(finalTotalEvents / EVENTS_PER_PAGE)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage * EVENTS_PER_PAGE >= finalTotalEvents}
              className="rounded-xl h-12 w-12 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </div>
        )}
      </div>
    );
  }
}
