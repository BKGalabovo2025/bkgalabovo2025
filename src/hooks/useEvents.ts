import { useState, useEffect, useCallback } from "react";
import {
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  getEventsCollection,
  getTodayEventsQuery,
  getUpcomingEventsQuery,
  getPastEventsQuery,
} from "@/lib/firebase-collections";
import { docToScheduleEvent } from "@/services/schedule-service";
import { toISOStringOrUndefined } from "@/lib/date-utils";
import { ScheduleEvent, Member, Attendee } from "@/types";
import { toast } from "sonner";
import { getAllMembers } from "@/services/member-service";
import { formatFullName } from "@/lib/utils";

type NewEvent = Omit<ScheduleEvent, "id">;

import { useAppStore } from "@/store/use-app-store";
import { invalidateDashboardCacheAction } from "@/lib/actions/dashboard";
import { updateAttendeesAction } from "@/lib/actions/events";
import { useAuth } from "@/context/auth-context";

/**
 * Smart-streaming events hook.
 *
 * Strategy:
 * - Phase 1 (Critical): subscribes to ONLY today's events -> isLoading becomes false instantly.
 * - Phase 2 (Background): subscribes to upcoming events (tomorrow onwards).
 * - Phase 3 (Delayed): past events are fetched automatically in the background 300ms after load.
 */
export const useEvents = () => {
  const [todayEvents, setTodayEvents] = useState<ScheduleEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<ScheduleEvent[]>([]);

  const [members, setMembers] = useState<Member[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpcomingLoading, setIsUpcomingLoading] = useState(true);
  const [isPastLoading, setIsPastLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { activeBranch } = useAppStore();
  const { getFreshToken } = useAuth();

  // --- Members ---
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersData = await getAllMembers();
        setMembers(membersData);
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };
    fetchMembers();
  }, [activeBranch]);

  /**
   * Helper: converts a Firestore snapshot doc to a ScheduleEvent,
   * enriching attendee names from the loaded members list.
   */
  const docToEnrichedEvent = useCallback(
    (doc: Parameters<typeof docToScheduleEvent>[0]): ScheduleEvent | null => {
      const event = docToScheduleEvent(doc);
      if (!event) return null;
      return {
        ...event,
        attendees: (event.attendees || []).map((attendee) => ({
          ...attendee,
          name:
            members.find((m) => m.id === attendee.memberId)?.name ||
            attendee.name ||
            "Unknown",
        })),
      } as ScheduleEvent;
    },
    [members]
  );

  // --- Phase 1: Today events — immediate load, unblocks UI ---
  useEffect(() => {
    const q = getTodayEventsQuery();

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsData = snapshot.docs
          .map(docToEnrichedEvent)
          .filter(Boolean) as ScheduleEvent[];
        setTodayEvents(eventsData);
        setIsLoading(false); // Unblock the UI as soon as today is ready!
      },
      (err) => {
        console.error("Error fetching today events:", err);
        setError(err);
        setIsLoading(false);
        toast.error("Грешка при зареждане на днешните събития");
      }
    );

    return () => unsubscribe();
  }, [members, activeBranch, docToEnrichedEvent]);

  // --- Phase 2: Upcoming events — background load ---
  useEffect(() => {
    const q = getUpcomingEventsQuery();

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsData = snapshot.docs
          .map(docToEnrichedEvent)
          .filter(Boolean) as ScheduleEvent[];
        setUpcomingEvents(eventsData);
        setIsUpcomingLoading(false);
      },
      (err) => {
        console.error("Error fetching upcoming events:", err);
        setIsUpcomingLoading(false);
      }
    );

    return () => unsubscribe();
  }, [members, activeBranch, docToEnrichedEvent]);

  // --- Phase 3: Past events — delayed background load (300ms) ---
  useEffect(() => {
    setIsPastLoading(true);
    let unsubscribe: () => void;

    const timer = setTimeout(() => {
      const q = getPastEventsQuery();

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const eventsData = snapshot.docs
            .map(docToEnrichedEvent)
            .filter(Boolean) as ScheduleEvent[];
          setPastEvents(eventsData);
          setIsPastLoading(false);
        },
        (err) => {
          console.error("Error fetching past events:", err);
          setIsPastLoading(false);
        }
      );
    }, 300);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [members, activeBranch, docToEnrichedEvent]);

  // Merged events for consumers
  const events = [...todayEvents, ...upcomingEvents, ...pastEvents];

  // --- Mutations (unchanged from original) ---

  const addEvent = useCallback(async (event: NewEvent) => {
    try {
      await addDoc(getEventsCollection(), event as ScheduleEvent);
      toast.success("Събитието е създадено успешно", {
        description: `"${event.title}" беше добавено към графика.`,
      });
      invalidateDashboardCacheAction().catch((err) =>
        console.error("Cache invalidation failed", err)
      );
    } catch (err) {
      console.error("Error adding event:", err);
      toast.error("Грешка при добавяне на събитие", {
        description: "Действието се провали. Моля, опитайте отново.",
      });
      throw err;
    }
  }, []);

  const addMultipleEvents = useCallback(async (events: NewEvent[]) => {
    const db = getDb();
    const batch = writeBatch(db);
    const eventsCollection = getEventsCollection();
    events.forEach((event) => {
      const docRef = doc(eventsCollection);
      batch.set(docRef, event);
    });
    try {
      await batch.commit();
      toast.success("Графикът е генериран", {
        description: `Успешно бяха създадени ${events.length} събития.`,
      });
      invalidateDashboardCacheAction().catch((err) =>
        console.error("Cache invalidation failed", err)
      );
    } catch (err) {
      console.error("Error adding multiple events:", err);
      toast.error("Грешка при генериране на графика", {
        description: "Действието се провали. Моля, опитайте отново.",
      });
      throw err;
    }
  }, []);

  const updateEvent = useCallback(
    async (eventId: string, eventData: Partial<NewEvent>) => {
      let originalToday: ScheduleEvent[] = [];
      let originalUpcoming: ScheduleEvent[] = [];
      let originalPast: ScheduleEvent[] = [];

      const optimisticPayload: Partial<ScheduleEvent> = {
        ...eventData,
      };

      if ("startDate" in eventData) {
        optimisticPayload.startDate = toISOStringOrUndefined(
          eventData.startDate as Date | Timestamp | string | undefined
        );
      }
      if ("endDate" in eventData) {
        optimisticPayload.endDate = toISOStringOrUndefined(
          eventData.endDate as Date | Timestamp | string | undefined
        );
      }

      const updater = (currentEvents: ScheduleEvent[]) =>
        currentEvents.map((e) =>
          e.id === eventId
            ? ({ ...e, ...optimisticPayload } as ScheduleEvent)
            : e
        );

      setTodayEvents((c) => {
        originalToday = c;
        return updater(c);
      });
      setUpcomingEvents((c) => {
        originalUpcoming = c;
        return updater(c);
      });
      setPastEvents((c) => {
        originalPast = c;
        return updater(c);
      });

      try {
        const eventRef = doc(getEventsCollection(), eventId);
        await setDoc(eventRef, eventData as ScheduleEvent, { merge: true });
        toast.success("Събитието е обновено");
        invalidateDashboardCacheAction().catch((err) =>
          console.error("Cache invalidation failed", err)
        );
      } catch (err) {
        setTodayEvents(originalToday);
        setUpcomingEvents(originalUpcoming);
        setPastEvents(originalPast);
        console.error("Error updating event:", err);
        toast.error("Грешка при обновяване", {
          description: "Промените не бяха запазени. Моля, опитайте отново.",
        });
        throw err;
      }
    },
    []
  );

  const deleteEvent = useCallback(async (eventId: string) => {
    const db = getDb();
    let originalToday: ScheduleEvent[] = [];
    let originalUpcoming: ScheduleEvent[] = [];
    let originalPast: ScheduleEvent[] = [];
    let eventTitle: string | undefined = "";

    const filterFn = (currentEvents: ScheduleEvent[]) => {
      const found = currentEvents.find((e) => e.id === eventId);
      if (found && !eventTitle) eventTitle = found.title;
      return currentEvents.filter((e) => e.id !== eventId);
    };

    setTodayEvents((c) => {
      originalToday = c;
      return filterFn(c);
    });
    setUpcomingEvents((c) => {
      originalUpcoming = c;
      return filterFn(c);
    });
    setPastEvents((c) => {
      originalPast = c;
      return filterFn(c);
    });

    try {
      const eventRef = doc(db, "events", eventId);
      await deleteDoc(eventRef);
      toast.success("Събитието е изтрито", {
        description: eventTitle ? `"${eventTitle}" беше премахнато.` : "",
      });
      invalidateDashboardCacheAction().catch((err) =>
        console.error("Cache invalidation failed", err)
      );
    } catch (err) {
      setTodayEvents(originalToday);
      setUpcomingEvents(originalUpcoming);
      setPastEvents(originalPast);
      console.error("Error deleting event:", err);
      toast.error("Грешка при изтриване");
      throw err;
    }
  }, []);

  const updateAttendees = useCallback(
    async (eventId: string, newAttendees: Attendee[]) => {
      let originalToday: ScheduleEvent[] = [];
      let originalUpcoming: ScheduleEvent[] = [];
      let originalPast: ScheduleEvent[] = [];

      const attendeeMemberIds = newAttendees.map((a) => a.memberId);
      const updatedAttendees = newAttendees.map((a) => {
        const member = members.find((m) => m.id === a.memberId);
        return {
          ...a,
          name: member ? formatFullName(member) : "Unknown",
        };
      });

      const updater = (currentEvents: ScheduleEvent[]) => {
        return currentEvents.map((e) => {
          if (e.id === eventId) {
            return { ...e, attendees: updatedAttendees, attendeeMemberIds };
          }
          return e;
        });
      };

      // Optimistic update
      setTodayEvents((c) => {
        originalToday = [...c];
        return updater(c);
      });
      setUpcomingEvents((c) => {
        originalUpcoming = [...c];
        return updater(c);
      });
      setPastEvents((c) => {
        originalPast = [...c];
        return updater(c);
      });

      try {
        const token = await getFreshToken();
        if (!token) throw new Error("No authentication token available");

        const result = await updateAttendeesAction(
          token,
          eventId,
          newAttendees
        );

        if (!result.success) {
          throw new Error(result.message || "Failed to update attendees");
        }

        // If the server auto-updated payment statuses, sync optimistic state
        if (result.updatedAttendees) {
          const finalUpdater = (currentEvents: ScheduleEvent[]) =>
            currentEvents.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    attendees: result.updatedAttendees,
                    attendeeMemberIds,
                  }
                : e
            );

          setTodayEvents(finalUpdater);
          setUpcomingEvents(finalUpdater);
          setPastEvents(finalUpdater);
        }

        toast.success("Присъствията са обновени", {
          description: "Списъкът с присъстващи е запазен.",
        });
        invalidateDashboardCacheAction().catch((err) =>
          console.error("Cache invalidation failed", err)
        );
      } catch (err) {
        // Rollback on error
        setTodayEvents(originalToday);
        setUpcomingEvents(originalUpcoming);
        setPastEvents(originalPast);
        console.error("Error updating attendees:", err);
        toast.error("Грешка при обновяване на присъствия");
        throw err;
      }
    },
    [members, getFreshToken]
  );

  return {
    events,
    todayEvents,
    upcomingEvents,
    pastEvents,
    addEvent,
    addMultipleEvents,
    updateEvent,
    deleteEvent,
    updateAttendees,
    isLoading,
    isUpcomingLoading,
    isPastLoading,
    error,
    members,
  };
};
