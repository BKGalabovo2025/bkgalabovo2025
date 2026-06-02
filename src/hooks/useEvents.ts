import { useState, useEffect, useCallback, useRef } from "react";
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
  getActiveEventsQuery,
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
 * - Phase 1 (immediate): subscribes to current + upcoming events only
 *   (startDate >= today midnight) → `isLoading` becomes false quickly
 * - Phase 2 (lazy): past events are fetched only when `loadPast = true`
 *   is passed by the consumer (i.e. when the "Минали" tab is clicked)
 *
 * @param loadPast - set to true to trigger loading of past events
 */
export const useEvents = (loadPast = false) => {
  const [activeEvents, setActiveEvents] = useState<ScheduleEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<ScheduleEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPastLoading, setIsPastLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { activeBranch } = useAppStore();
  const { getFreshToken } = useAuth();

  // Track whether past subscription is already set up
  const pastUnsubRef = useRef<(() => void) | null>(null);

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

  // --- Phase 1: Active events (today + upcoming) — immediate load ---
  useEffect(() => {
    const q = getActiveEventsQuery();

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsData = snapshot.docs
          .map(docToEnrichedEvent)
          .filter(Boolean) as ScheduleEvent[];
        setActiveEvents(eventsData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching active events:", err);
        setError(err);
        setIsLoading(false);
        toast.error("Грешка при зареждане на събитията", {
          description: "Не може да се установи връзка със сървъра.",
        });
      }
    );

    return () => unsubscribe();
  }, [members, activeBranch, docToEnrichedEvent]);

  // --- Phase 2: Past events — lazy, only when loadPast becomes true ---
  useEffect(() => {
    if (!loadPast) return;

    // Avoid re-subscribing if already subscribed
    if (pastUnsubRef.current) return;

    setIsPastLoading(true);
    const q = getPastEventsQuery();

    const unsubscribe = onSnapshot(
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
        toast.error("Грешка при зареждане на минали събития");
      }
    );

    pastUnsubRef.current = unsubscribe;

    return () => {
      if (pastUnsubRef.current) {
        pastUnsubRef.current();
        pastUnsubRef.current = null;
      }
    };
  }, [loadPast, members, activeBranch, docToEnrichedEvent]);

  // Merged events for consumers that need everything
  const events = [...activeEvents, ...pastEvents];

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
      let originalEvents: ScheduleEvent[] = [];

      setActiveEvents((currentEvents) => {
        originalEvents = currentEvents;
        const optimisticPayload = {
          ...eventData,
          startDate: toISOStringOrUndefined(
            eventData.startDate as Date | Timestamp | string | undefined
          ),
          endDate: toISOStringOrUndefined(
            eventData.endDate as Date | Timestamp | string | undefined
          ),
        };
        return currentEvents.map((e) =>
          e.id === eventId
            ? ({ ...e, ...optimisticPayload } as ScheduleEvent)
            : e
        );
      });

      try {
        const eventRef = doc(getEventsCollection(), eventId);
        await setDoc(eventRef, eventData as ScheduleEvent, { merge: true });
        toast.success("Събитието е обновено");
        invalidateDashboardCacheAction().catch((err) =>
          console.error("Cache invalidation failed", err)
        );
      } catch (err) {
        setActiveEvents(originalEvents);
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
    let originalActive: ScheduleEvent[] = [];
    let eventTitle: string | undefined = "";

    setActiveEvents((currentEvents) => {
      originalActive = currentEvents;
      eventTitle = currentEvents.find((e) => e.id === eventId)?.title;
      return currentEvents.filter((e) => e.id !== eventId);
    });
    setPastEvents((currentEvents) =>
      currentEvents.filter((e) => e.id !== eventId)
    );

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
      setActiveEvents(originalActive);
      console.error("Error deleting event:", err);
      toast.error("Грешка при изтриване");
      throw err;
    }
  }, []);

  const updateAttendees = useCallback(
    async (eventId: string, newAttendees: Attendee[]) => {
      let originalActive: ScheduleEvent[] = [];

      const attendeeMemberIds = newAttendees.map((a) => a.memberId);

      // Optimistic update
      setActiveEvents((currentEvents) => {
        originalActive = [...currentEvents];
        return currentEvents.map((e) => {
          if (e.id === eventId) {
            const updatedAttendees = newAttendees.map((a) => {
              const member = members.find((m) => m.id === a.memberId);
              return {
                ...a,
                name: member ? formatFullName(member) : "Unknown",
              };
            });
            return { ...e, attendees: updatedAttendees, attendeeMemberIds };
          } else {
            return e;
          }
        });
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
          setActiveEvents((currentEvents) =>
            currentEvents.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    attendees: result.updatedAttendees,
                    attendeeMemberIds,
                  }
                : e
            )
          );
        }

        toast.success("Присъствията са обновени", {
          description: "Списъкът с присъстващи е запазен.",
        });
        invalidateDashboardCacheAction().catch((err) =>
          console.error("Cache invalidation failed", err)
        );
      } catch (err) {
        // Rollback on error
        setActiveEvents(originalActive);
        console.error("Error updating attendees:", err);
        toast.error("Грешка при обновяване на присъствия");
        throw err;
      }
    },
    [members, getFreshToken]
  );

  return {
    events,
    activeEvents,
    pastEvents,
    addEvent,
    addMultipleEvents,
    updateEvent,
    deleteEvent,
    updateAttendees,
    isLoading,
    isPastLoading,
    error,
    members,
  };
};
