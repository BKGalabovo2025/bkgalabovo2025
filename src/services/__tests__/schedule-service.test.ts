import { describe, it, expect, vi, beforeEach } from "vitest";
import { docToScheduleEvent, getEventsForPeriod, getEventsByMemberId } from "../schedule-service";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<typeof import("firebase/firestore")>("firebase/firestore");
  return {
    ...actual,
    getDocs: vi.fn(),
    query: vi.fn((q) => q),
    where: vi.fn(),
  };
});

vi.mock("@/lib/firebase-collections", () => ({
  getEventsQuery: vi.fn(() => ({})),
}));

describe("schedule-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("docToScheduleEvent", () => {
    it("returns null if doc does not exist or has no id", () => {
      const mockDoc = { id: "", exists: () => false, data: () => ({}) } as unknown as DocumentSnapshot;
      expect(docToScheduleEvent(mockDoc)).toBeNull();
    });

    it("correctly maps a valid document to ScheduleEvent", () => {
      const mockData = {
        title: "Бадминтон Тренировка",
        description: "Вечерна сесия",
        startDate: "2026-08-01T18:00:00.000Z",
        endDate: "2026-08-01T20:00:00.000Z",
        type: "training",
        location: "Зала Гълъбово",
        attendees: [
          {
            memberId: "m1",
            name: "Иван Иванов",
            attended: true,
            paymentStatus: "paid",
            isGuest: false,
          },
          {
            memberId: "m2",
            name: "Петър Петров",
            attended: false,
          },
        ],
        attendeeMemberIds: ["m1", "m2"],
        isCancelled: false,
        totalCampPrice: 150,
      };

      const mockDoc = {
        id: "event_123",
        exists: () => true,
        data: () => mockData,
      } as unknown as QueryDocumentSnapshot;

      const result = docToScheduleEvent(mockDoc);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("event_123");
      expect(result?.title).toBe("Бадминтон Тренировка");
      expect(result?.type).toBe("training");
      expect(result?.attendees).toHaveLength(2);
      expect(result?.attendees[0].name).toBe("Иван Иванов");
      expect(result?.attendees[0].attended).toBe(true);
      expect(result?.totalCampPrice).toBe(150);
    });

    it("handles fallback default values for missing fields", () => {
      const mockDoc = {
        id: "event_minimal",
        exists: () => true,
        data: () => ({}),
      } as unknown as QueryDocumentSnapshot;

      const result = docToScheduleEvent(mockDoc);

      expect(result?.id).toBe("event_minimal");
      expect(result?.title).toBe("Untitled Event");
      expect(result?.location).toBe("Unknown Location");
      expect(result?.type).toBe("other");
      expect(result?.attendees).toEqual([]);
      expect(result?.isCancelled).toBe(false);
    });
  });

  describe("getEventsForPeriod", () => {
    it("queries Firestore and maps events in period", async () => {
      const { getDocs } = await import("firebase/firestore");
      const mockDocs = [
        {
          id: "event_1",
          exists: () => true,
          data: () => ({
            title: "Състезание",
            startDate: "2026-08-01T10:00:00.000Z",
            type: "competition",
          }),
        },
      ];

      (getDocs as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        docs: mockDocs,
      });

      const startDate = new Date("2026-08-01T00:00:00.000Z");
      const endDate = new Date("2026-08-01T23:59:59.000Z");

      const events = await getEventsForPeriod(startDate, endDate);

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe("event_1");
      expect(events[0].title).toBe("Състезание");
    });
  });

  describe("getEventsByMemberId", () => {
    it("fetches and sorts member events by start date descending", async () => {
      const { getDocs } = await import("firebase/firestore");
      const mockDocs = [
        {
          id: "event_old",
          exists: () => true,
          data: () => ({
            title: "Стара тренировка",
            startDate: "2026-07-01T10:00:00.000Z",
            attendeeMemberIds: ["m1"],
          }),
        },
        {
          id: "event_new",
          exists: () => true,
          data: () => ({
            title: "Нова тренировка",
            startDate: "2026-07-20T10:00:00.000Z",
            attendeeMemberIds: ["m1"],
          }),
        },
      ];

      (getDocs as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        docs: mockDocs,
      });

      const events = await getEventsByMemberId("m1");

      expect(events).toHaveLength(2);
      expect(events[0].id).toBe("event_new");
      expect(events[1].id).toBe("event_old");
    });
  });
});
