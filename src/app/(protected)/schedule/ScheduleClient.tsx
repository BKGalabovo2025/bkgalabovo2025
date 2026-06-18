"use client";

import { useState, useMemo, useEffect } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useSearchParams, useRouter } from "next/navigation";
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
  Calendar as CalendarIcon,
  Plus,
  ShieldAlert,
  History,
  LayoutGrid,
} from "lucide-react";
import dynamic from "next/dynamic";
import { PrintableEvent } from "@/components/schedule/PrintableEvent";

const CreateEventDialog = dynamic(
  () =>
    import("@/components/schedule/CreateEventDialog").then(
      (m) => m.CreateEventDialog
    ),
  { ssr: false }
);
const EditEventDialog = dynamic(
  () =>
    import("@/components/schedule/EditEventDialog").then(
      (m) => m.EditEventDialog
    ),
  { ssr: false }
);
const AttendeesDialog = dynamic(
  () =>
    import("@/components/schedule/AttendeesDialog").then(
      (m) => m.AttendeesDialog
    ),
  { ssr: false }
);
const MonthlyScheduleDialog = dynamic(
  () => import("@/components/schedule/MonthlyScheduleDialog"),
  { ssr: false }
);
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
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

// Reservations components
import { AgendaView } from "@/components/reservations/agenda-view";
import { ReservationHistory } from "@/components/reservations/reservation-history";

const ReservationDialog = dynamic(
  () =>
    import("@/components/reservations/reservation-dialog").then(
      (m) => m.ReservationDialog
    ),
  { ssr: false }
);
const BlockSlotDialog = dynamic(
  () =>
    import("@/components/reservations/block-slot-dialog").then(
      (m) => m.BlockSlotDialog
    ),
  { ssr: false }
);

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
const COURT_COUNT = 6;

export default function ScheduleClient() {
  const { activeBranch } = useAppStore();
  const isRecoveryZone = activeBranch === "recoveryzone";
  const router = useRouter();

  const {
    events,
    members,
    addEvent,
    addMultipleEvents,
    updateEvent,
    deleteEvent,
    updateAttendees,
    isLoading,
    isUpcomingLoading,
    isPastLoading,
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

  // Unified Top-level main tabs
  const [activeMainTab, setActiveMainTab] = useState<
    "events" | "courts" | "recovery"
  >("events");

  // Reservations states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeReservationTab, setActiveReservationTab] = useState("schedule");

  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  // Sync main tab selection based on URL parameter or Recovery branch
  useEffect(() => {
    if (isRecoveryZone || urlTab === "reservations" || urlTab === "courts") {
      setActiveMainTab("courts");
    } else {
      setActiveMainTab("events");
    }
  }, [urlTab, isRecoveryZone]);

  // Handle direct links to events (e.g. from attendance history)
  useEffect(() => {
    const eventId = searchParams.get("eventId");
    if (eventId && events.length > 0) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        setAttendeesDialogOpen(true);

        // Determine which tab the event should be in
        const eventDate = new Date(event.startDate);
        const endDate = new Date(event.endDate || event.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (eventDate < tomorrow && endDate >= today) {
          setActiveTab("current");
        } else if (eventDate >= tomorrow) {
          setActiveTab("upcoming");
        } else {
          setActiveTab("past");
        }
      }
    }
  }, [searchParams, events]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
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

  const closeAttendeesDialog = () => {
    setAttendeesDialogOpen(false);
    if (searchParams.get("eventId")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("eventId");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
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
    const filtered = (events || [])
      .filter(
        (event) =>
          event.startDate && !isNaN(new Date(event.startDate).getTime())
      )
      .filter((event) => {
        if (filterType !== "all" && event.type !== filterType) return false;

        const eventDate = new Date(event.startDate);
        const endDate = new Date(event.endDate || event.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (activeTab) {
          case "current":
            return eventDate < tomorrow && endDate >= today;
          case "upcoming":
            return eventDate >= tomorrow;
          case "past":
            return endDate < today;
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
        const date = new Date(event.startDate);
        const month =
          activeTab === "current"
            ? "Днес"
            : date.toLocaleString("bg-BG", {
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

  // Reservations handlers
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

  const handleSaveReservation = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleViewInCalendar = (date: Date) => {
    setCurrentDate(date);
    setActiveReservationTab("schedule");
  };

  let errorObject: Error | null = null;
  if (error) {
    if (typeof error === "string") {
      errorObject = new Error(error);
    } else {
      errorObject = error;
    }
  }

  // Dynamic PageHeader actions based on active main tab
  const headerActions = useMemo(() => {
    if (
      activeMainTab === "courts" ||
      activeMainTab === "recovery" ||
      isRecoveryZone
    ) {
      const mode =
        activeMainTab === "recovery" || isRecoveryZone ? "recovery" : "courts";
      return (
        <div className="flex items-center gap-3">
          <ReservationDialog mode={mode} onSave={handleSaveReservation}>
            <Button className="rounded-xl font-medium uppercase tracking-widest text-[11px] h-12 px-8 bg-primary text-white hover:bg-primary/90 shadow-none transition-all">
              <Plus className="mr-3 h-4 w-4" strokeWidth={2.5} /> Нова
              Резервация
            </Button>
          </ReservationDialog>
          {!isRecoveryZone && activeBranch === "bkgalabovo" && (
            <BlockSlotDialog
              onSave={handleSaveReservation}
              courtCount={COURT_COUNT}
            >
              <Button
                variant="outline"
                className="rounded-xl border-zinc-200 dark:border-zinc-800 h-12 px-6 font-medium text-[11px] uppercase tracking-widest bg-white dark:bg-zinc-900 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-none"
              >
                <ShieldAlert
                  className="mr-3 h-4 w-4 text-zinc-400"
                  strokeWidth={1.5}
                />
                Блокирай
              </Button>
            </BlockSlotDialog>
          )}
        </div>
      );
    } else {
      return (
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
      );
    }
  }, [activeMainTab, isRecoveryZone, activeBranch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={!isRecoveryZone ? "График" : "Резервации & Релакс"}
        description={
          isRecoveryZone
            ? "Управление на резервации за възстановителни процедури в recoveryzone."
            : activeMainTab === "courts"
              ? "Управление на кортовете и заетостта в реално време."
              : activeMainTab === "recovery"
                ? "Управление на резервации за възстановителни процедури."
                : "Управление на тренировъчни графици, състезания и клубни събития."
        }
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: !isRecoveryZone ? "График" : "Резервации & Релакс" },
        ]}
      >
        {headerActions}
      </PageHeader>

      {/* Top-Level Main Tabs (Hidden in Recovery Zone) */}
      {!isRecoveryZone && (
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-8 mb-4">
          <button
            onClick={() => setActiveMainTab("events")}
            className={cn(
              "pb-4 text-xs font-semibold tracking-widest uppercase transition-all border-b-2 relative",
              activeMainTab === "events"
                ? "border-primary text-zinc-950 dark:text-white"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            Тренировки & Събития
          </button>
          <button
            onClick={() => setActiveMainTab("courts")}
            className={cn(
              "pb-4 text-xs font-semibold tracking-widest uppercase transition-all border-b-2 relative",
              activeMainTab === "courts"
                ? "border-primary text-zinc-950 dark:text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-650"
            )}
          >
            Резервация на кортове
          </button>
          <button
            onClick={() => setActiveMainTab("recovery")}
            className={cn(
              "pb-4 text-xs font-semibold tracking-widest uppercase transition-all border-b-2 relative",
              activeMainTab === "recovery"
                ? "border-primary text-zinc-950 dark:text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-650"
            )}
          >
            Резервация за възстановяване
          </button>
        </div>
      )}

      {/* Conditional Content Rendering */}
      {activeMainTab === "events" && !isRecoveryZone ? (
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
                <span className="flex items-center gap-2">
                  Предстоящи
                  {isUpcomingLoading && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="rounded-xl px-8 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
              >
                <span className="flex items-center gap-2">
                  Минали
                  {isPastLoading && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </span>
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
                <SelectTrigger
                  aria-label="Филтрирай по тип събитие"
                  className="h-12 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-none font-light text-sm focus:ring-primary"
                >
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
                <TabsContent value="current" className="mt-0 outline-none">
                  {renderEventsList(filteredEvents, groupedEvents)}
                </TabsContent>
                <TabsContent value="upcoming" className="mt-0 outline-none">
                  {renderEventsList(filteredEvents, groupedEvents)}
                </TabsContent>
                <TabsContent value="past" className="mt-0 outline-none">
                  {renderEventsList(
                    paginatedEvents,
                    groupedEvents,
                    filteredEvents.length
                  )}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      ) : (
        /* Courts Reservations Grid Layout */
        <Tabs
          value={activeReservationTab}
          onValueChange={setActiveReservationTab}
          className="space-y-6 w-full"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-3 pr-5 rounded-4xl border border-zinc-100 dark:border-zinc-900 shadow-sm shadow-black/2">
            <TabsList className="bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-3xl h-14 border border-zinc-200/50 dark:border-zinc-800/50">
              <TabsTrigger
                value="schedule"
                className="rounded-2xl px-6 h-full font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all flex items-center gap-2.5"
              >
                <LayoutGrid className="h-4 w-4" />
                Дневен График
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-2xl px-6 h-full font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all flex items-center gap-2.5"
              >
                <History className="h-4 w-4" />
                История
              </TabsTrigger>
            </TabsList>

            {activeReservationTab === "schedule" && (
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
                  key={`${currentDate.toISOString()}-${refreshKey}-${activeMainTab}`}
                  refreshKey={refreshKey}
                  date={currentDate}
                  courtCount={COURT_COUNT}
                  mode={
                    activeMainTab === "recovery" || isRecoveryZone
                      ? "recovery"
                      : "courts"
                  }
                />
              </div>
            </BentoCard>
          </TabsContent>

          <TabsContent value="history" className="mt-0 outline-none">
            <ReservationHistory
              onViewInCalendar={handleViewInCalendar}
              mode={
                activeMainTab === "recovery" || isRecoveryZone
                  ? "recovery"
                  : "courts"
              }
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Scheduler Dialogs */}
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
        onClose={closeAttendeesDialog}
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
                <h2 className="text-[11px] font-medium uppercase tracking-[0.4em] text-zinc-600 dark:text-zinc-400 shrink-0">
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
              aria-label="Предишна страница"
              className="rounded-xl h-12 w-12 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </Button>
            <span className="font-medium text-[11px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400 px-4">
              Страница {currentPage}{" "}
              <span className="text-zinc-200 dark:text-zinc-800 mx-4">/</span>{" "}
              {Math.ceil(finalTotalEvents / EVENTS_PER_PAGE)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage * EVENTS_PER_PAGE >= finalTotalEvents}
              aria-label="Следваща страница"
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
