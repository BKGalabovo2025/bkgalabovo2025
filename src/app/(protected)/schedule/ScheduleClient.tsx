"use client";

import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  LayoutGrid,
  Loader2,
  Plus,
  PlusCircle,
  Repeat,
  ShieldAlert,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PrintableEvent } from "@/components/schedule/PrintableEvent";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/useEvents";

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
const CampManagerDialog = dynamic(
  () =>
    import("@/components/schedule/CampManagerDialog").then(
      (m) => m.CampManagerDialog
    ),
  { ssr: false }
);
const MonthlyScheduleDialog = dynamic(
  () => import("@/components/schedule/MonthlyScheduleDialog"),
  { ssr: false }
);
const BusinessTripManagerDialog = dynamic(
  () =>
    import("@/components/business-trips/BusinessTripManagerDialog").then(
      (m) => m.BusinessTripManagerDialog
    ),
  { ssr: false }
);
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { EventListItem } from "@/components/schedule/EventListItem";
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
import { BentoCard } from "@/components/ui/bento-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { Attendee, Member, ScheduleEvent, ScheduleEventType } from "@/types";

// Reservations components
const AgendaView = dynamic(
  () =>
    import("@/components/reservations/agenda-view").then((m) => m.AgendaView),
  { ssr: false }
);
const ReservationHistory = dynamic(
  () =>
    import("@/components/reservations/reservation-history").then(
      (m) => m.ReservationHistory
    ),
  { ssr: false }
);

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
  const [isCampManagerOpen, setCampManagerOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isMonthlyDialogOpen, setMonthlyDialogOpen] = useState(false);
  const [isTripsDialogOpen, setTripsDialogOpen] = useState(false);

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

    printWindow.onafterprint = () => {
      printWindow.close();
    };

    setTimeout(() => {
      printWindow.print();
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

  const handleToggleCancel = async (
    eventId: string,
    currentStatus: boolean
  ) => {
    await updateEvent(eventId, { isCancelled: !currentStatus });
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

  const getPageDescription = () => {
    if (isRecoveryZone)
      return "Управление на резервации за възстановителни процедури в recoveryzone.";
    if (activeMainTab === "courts")
      return "Управление на кортовете и заетостта в реално време.";
    if (activeMainTab === "recovery")
      return "Управление на резервации за възстановителни процедури.";
    return "Управление на тренировъчни графици, състезания и клубни събития.";
  };

  const renderEventsTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-6 py-40">
          <Loader2
            className="size-12 animate-spin text-primary opacity-20"
            strokeWidth={1}
          />
          <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
            Зареждане на събития...
          </p>
        </div>
      );
    }

    if (errorObject) {
      return (
        <div className="flex flex-col items-center py-40 text-center text-rose-500">
          <AlertTriangle className="mb-6 size-12 opacity-20" strokeWidth={1} />
          <p className="text-2xl font-light text-zinc-900 dark:text-white">
            Грешка при зареждане
          </p>
          <p className="mt-2 text-sm font-light text-zinc-400">
            {errorObject.message}
          </p>
        </div>
      );
    }

    return (
      <>
        <TabsContent value="current" className="mt-0 outline-none">
          <EventsList
            eventsToShow={filteredEvents}
            grouped={groupedEvents}
            filterType={filterType}
            activeTab={activeTab}
            members={members as Member[]}
            membersMap={membersMap}
            openEditDialog={openEditDialog}
            openDeleteDialog={openDeleteDialog}
            openAttendeesDialog={(e) => {
              setSelectedEvent(e);
              if (e.type === "camp") {
                setCampManagerOpen(true);
              } else {
                setAttendeesDialogOpen(true);
              }
            }}
            onManageTrips={(e) => {
              setSelectedEvent(e);
              setTripsDialogOpen(true);
            }}
            onToggleCancel={handleToggleCancel}
            triggerPrint={triggerPrint}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-0 outline-none">
          <EventsList
            eventsToShow={filteredEvents}
            grouped={groupedEvents}
            filterType={filterType}
            activeTab={activeTab}
            members={members as Member[]}
            membersMap={membersMap}
            openEditDialog={openEditDialog}
            openDeleteDialog={openDeleteDialog}
            openAttendeesDialog={(e) => {
              setSelectedEvent(e);
              if (e.type === "camp") {
                setCampManagerOpen(true);
              } else {
                setAttendeesDialogOpen(true);
              }
            }}
            onManageTrips={(e) => {
              setSelectedEvent(e);
              setTripsDialogOpen(true);
            }}
            onToggleCancel={handleToggleCancel}
            triggerPrint={triggerPrint}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </TabsContent>
        <TabsContent value="past" className="mt-0 outline-none">
          <EventsList
            eventsToShow={paginatedEvents}
            grouped={groupedEvents}
            totalEvents={filteredEvents.length}
            filterType={filterType}
            activeTab={activeTab}
            members={members as Member[]}
            membersMap={membersMap}
            openEditDialog={openEditDialog}
            openDeleteDialog={openDeleteDialog}
            openAttendeesDialog={(e) => {
              setSelectedEvent(e);
              if (e.type === "camp") {
                setCampManagerOpen(true);
              } else {
                setAttendeesDialogOpen(true);
              }
            }}
            onManageTrips={(e) => {
              setSelectedEvent(e);
              setTripsDialogOpen(true);
            }}
            onToggleCancel={handleToggleCancel}
            triggerPrint={triggerPrint}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </TabsContent>
      </>
    );
  };

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
            <Button className="h-12 rounded-xl bg-primary px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-primary/90">
              <Plus className="mr-3 size-4" strokeWidth={2.5} /> Нова Резервация{" "}
              {mode === "recovery" ? "на ПРОЦЕДУРА" : "на КОРТ"}
            </Button>
          </ReservationDialog>
          {!isRecoveryZone && activeBranch === "bkgalabovo" && (
            <BlockSlotDialog
              onSave={handleSaveReservation}
              courtCount={COURT_COUNT}
            >
              <Button
                variant="outline"
                className="h-12 rounded-xl border-zinc-200 bg-white px-6 text-[11px] font-medium tracking-widest uppercase shadow-none transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <ShieldAlert
                  className="mr-3 size-4 text-zinc-400"
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
            className="h-12 rounded-xl border-zinc-200 bg-white px-6 text-[11px] font-medium tracking-widest uppercase shadow-none transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            <Repeat className="mr-3 size-4" strokeWidth={1.5} /> Шаблонен график
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="h-12 rounded-xl bg-primary px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-primary/90"
          >
            <PlusCircle className="mr-3 size-4" strokeWidth={1.5} /> Създай
            събитие
          </Button>
        </div>
      );
    }
  }, [activeMainTab, isRecoveryZone, activeBranch]);

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title={!isRecoveryZone ? "График" : "Резервации & Релакс"}
        description={getPageDescription()}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: !isRecoveryZone ? "График" : "Резервации & Релакс" },
        ]}
      >
        {headerActions}
      </PageHeader>

      {/* Top-Level Main Tabs (Hidden in Recovery Zone) */}
      {!isRecoveryZone && (
        <div className="mb-4 flex gap-8 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveMainTab("events")}
            className={cn(
              "relative border-b-2 pb-4 text-xs font-semibold tracking-widest uppercase transition-all",
              activeMainTab === "events"
                ? "border-primary text-zinc-950 dark:text-white"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            )}
          >
            Тренировки & Събития
          </button>
          <button
            onClick={() => setActiveMainTab("courts")}
            className={cn(
              "relative border-b-2 pb-4 text-xs font-semibold tracking-widest uppercase transition-all",
              activeMainTab === "courts"
                ? "border-primary text-zinc-950 dark:text-white"
                : "hover:text-zinc-650 border-transparent text-zinc-400"
            )}
          >
            Резервация на кортове
          </button>
          <button
            onClick={() => setActiveMainTab("recovery")}
            className={cn(
              "relative border-b-2 pb-4 text-xs font-semibold tracking-widest uppercase transition-all",
              activeMainTab === "recovery"
                ? "border-primary text-zinc-950 dark:text-white"
                : "hover:text-zinc-650 border-transparent text-zinc-400"
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
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <TabsList className="w-full rounded-2xl border border-zinc-100 bg-zinc-100 p-1 md:w-fit dark:border-zinc-800 dark:bg-zinc-900">
              <TabsTrigger
                value="current"
                className="rounded-xl px-8 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
              >
                Текущи
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="rounded-xl px-8 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
              >
                <span className="flex items-center gap-2">
                  Предстоящи
                  {isUpcomingLoading && (
                    <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="rounded-xl px-8 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
              >
                <span className="flex items-center gap-2">
                  Минали
                  {isPastLoading && (
                    <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  )}
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="flex w-full items-center gap-3 md:w-75">
              <div className="flex size-12 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                <Filter className="size-4 text-zinc-400" strokeWidth={1.5} />
              </div>
              <Select
                onValueChange={(value: string) =>
                  setFilterType(value as ScheduleEventType | "all")
                }
                defaultValue="all"
              >
                <SelectTrigger
                  aria-label="Филтрирай по тип събитие"
                  className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light shadow-none focus:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <SelectValue placeholder="Филтрирай по тип" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
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

          <div className="space-y-6">{renderEventsTabContent()}</div>
        </Tabs>
      ) : (
        /* Courts Reservations Grid Layout */
        <Tabs
          value={activeReservationTab}
          onValueChange={setActiveReservationTab}
          className="w-full space-y-6"
        >
          <div className="flex flex-col items-center justify-between gap-6 rounded-4xl border border-zinc-100 bg-white p-3 pr-5 shadow-sm shadow-black/2 md:flex-row dark:border-zinc-900 dark:bg-zinc-950">
            <TabsList className="h-14 rounded-3xl border border-zinc-200/50 bg-zinc-100/50 p-1 dark:border-zinc-800/50 dark:bg-zinc-900/50">
              <TabsTrigger
                value="schedule"
                className="flex h-full items-center gap-2.5 rounded-2xl px-6 text-[10px] font-bold tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
              >
                <LayoutGrid className="size-4" />
                Дневен График
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex h-full items-center gap-2.5 rounded-2xl px-6 text-[10px] font-bold tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
              >
                <History className="size-4" />
                История
              </TabsTrigger>
            </TabsList>

            {activeReservationTab === "schedule" && (
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
      <CampManagerDialog
        isOpen={isCampManagerOpen}
        onClose={() => setCampManagerOpen(false)}
        event={selectedEvent}
        members={members as Member[]}
        onUpdateEvent={handleUpdateEvent}
        onUpdateAttendees={handleUpdateAttendees}
      />
      <MonthlyScheduleDialog
        isOpen={isMonthlyDialogOpen}
        onClose={() => setMonthlyDialogOpen(false)}
        onGenerate={handleGenerateMonthly}
      />
      {selectedEvent && (
        <BusinessTripManagerDialog
          open={isTripsDialogOpen}
          onOpenChange={setTripsDialogOpen}
          event={selectedEvent}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-4xl border-none bg-white p-10 shadow-none dark:bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl leading-tight font-light text-zinc-900 dark:text-white">
              Наистина ли искате да изтриете това събитие?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-4 text-sm leading-relaxed font-light text-zinc-400">
              Това действие не може да бъде отменено. Записът ще бъде премахнат
              окончателно от базата данни.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl border-zinc-100 bg-white px-6 text-[11px] font-medium tracking-widest uppercase dark:border-zinc-800 dark:bg-zinc-900">
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="h-12 rounded-xl bg-rose-500 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none hover:bg-rose-600"
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface EventsListProps {
  eventsToShow: ScheduleEvent[];
  grouped: Record<string, ScheduleEvent[]>;
  totalEvents?: number;
  filterType: string;
  activeTab: string;
  members: Member[];
  membersMap: Record<string, Member>;
  openEditDialog: (event: ScheduleEvent) => void;
  openDeleteDialog: (id: string) => void;
  openAttendeesDialog: (event: ScheduleEvent) => void;
  onManageTrips: (event: ScheduleEvent) => void;
  onToggleCancel: (eventId: string, currentStatus: boolean) => void;
  triggerPrint: (event: ScheduleEvent) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

function EventsList({
  eventsToShow,
  grouped,
  totalEvents,
  filterType,
  activeTab,
  members,
  membersMap,
  openEditDialog,
  openDeleteDialog,
  openAttendeesDialog,
  onManageTrips,
  onToggleCancel,
  triggerPrint,
  currentPage,
  setCurrentPage,
}: EventsListProps) {
  const finalTotalEvents = totalEvents ?? eventsToShow.length;

  if (finalTotalEvents === 0) {
    return (
      <BentoCard className="flex flex-col items-center justify-center rounded-5xl border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-40 text-center shadow-none dark:border-zinc-900 dark:bg-zinc-900/10">
        <div className="mb-10 flex size-32 items-center justify-center rounded-full border border-zinc-100 bg-white transition-all hover:scale-105 dark:border-zinc-800 dark:bg-zinc-900">
          <CalendarDays
            className="size-12 text-zinc-200 dark:text-zinc-700"
            strokeWidth={1}
          />
        </div>
        <h3 className="text-3xl font-light text-zinc-900 dark:text-white">
          {filterType === "all"
            ? `Няма ${tabTranslations[activeTab]} събития`
            : `Няма ${tabTranslations[activeTab]} събития от тип "${eventTypeTranslations[filterType as ScheduleEventType]}"`}
        </h3>
        <p className="mt-4 max-w-sm leading-relaxed font-light text-zinc-400">
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
              <h2 className="shrink-0 text-[11px] font-medium tracking-[0.4em] text-zinc-600 uppercase dark:text-zinc-400">
                {month}
              </h2>
              <div className="h-px w-full bg-zinc-100 dark:bg-zinc-900"></div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {(monthEvents as ScheduleEvent[]).map((event: ScheduleEvent) => (
                <EventListItem
                  key={event.id}
                  event={event}
                  members={members}
                  membersMap={membersMap}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                  onManageAttendees={openAttendeesDialog}
                  onManageTrips={onManageTrips}
                  onToggleCancel={onToggleCancel}
                  onPrint={triggerPrint}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeTab === "past" && finalTotalEvents > EVENTS_PER_PAGE && (
        <div className="mx-auto mt-16 flex w-fit items-center justify-center gap-8 rounded-2xl border border-zinc-100 bg-white p-2 shadow-none dark:border-zinc-900 dark:bg-zinc-950">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Предишна страница"
            className="size-12 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} />
          </Button>
          <span className="px-4 text-[11px] font-medium tracking-widest text-zinc-600 uppercase dark:text-zinc-400">
            Страница {currentPage}{" "}
            <span className="mx-4 text-zinc-200 dark:text-zinc-800">/</span>{" "}
            {Math.ceil(finalTotalEvents / EVENTS_PER_PAGE)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage * EVENTS_PER_PAGE >= finalTotalEvents}
            aria-label="Следваща страница"
            className="size-12 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <ChevronRight className="size-5" strokeWidth={1.5} />
          </Button>
        </div>
      )}
    </div>
  );
}
