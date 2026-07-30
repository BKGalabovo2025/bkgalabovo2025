import {
  addDoc,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentReference,
  DocumentSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Member, MemberFormData } from "@/types/member.types";

import {
  addMember,
  calculateAgeGroup,
  deleteMember,
  docToMember,
  updateMember,
} from "../member-service";

const mockCollectionRef = {} as CollectionReference;
const mockDocRef = {} as DocumentReference;

vi.mock("@/lib/firebase-collections", () => ({
  getMembersCollection: vi.fn(() => mockCollectionRef),
}));

vi.mock("firebase/firestore", async () => {
  const firestore =
    await vi.importActual<typeof import("firebase/firestore")>(
      "firebase/firestore"
    );
  return {
    ...firestore,
    addDoc: vi.fn(() => Promise.resolve({ id: "123" })),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    doc: vi.fn(() => mockDocRef),
  };
});

// Mock DocumentSnapshot
const mockDoc = (
  id: string,
  data: Record<string, unknown>,
  exists: boolean = true
) =>
  ({
    id,
    exists: () => exists,
    data: () => data,
  }) as unknown as DocumentSnapshot;

afterEach(() => {
  vi.clearAllMocks();
});

describe("member-service", () => {
  describe("docToMember", () => {
    it("should return null if doc does not exist", () => {
      const doc = mockDoc("1", {}, false);
      expect(docToMember(doc)).toBeNull();
    });

    it("should parse valid member data correctly", () => {
      const mockDate = new Date("2000-01-01T10:00:00Z");
      const data = {
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: Timestamp.fromDate(mockDate),
        skillLevel: "intermediate",
        status: "active",
        siteId: "bkgalabovo",
      };

      const doc = mockDoc("member1", data);
      const result = docToMember(doc);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("member1");
      expect(result?.name).toBe("John Doe");
      expect(result?.dateOfBirth).toBe(mockDate.toISOString());
      expect(result?.skillLevel).toBe("intermediate");
    });

    it("should handle missing fields with defaults", () => {
      const data = {
        firstName: "Jane",
        lastName: "Doe",
        status: "active",
        siteId: "bkgalabovo",
      };

      const doc = mockDoc("member2", data);
      const result = docToMember(doc);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Jane Doe");
      expect(result?.skillLevel).toBeNull();
    });

    it("should return null for invalid data", () => {
      const data = {
        status: "active",
      };

      const doc = mockDoc("member3", data);
      const result = docToMember(doc);

      expect(result).toBeNull();
    });
  });

  describe("addMember", () => {
    it("should call addDoc with correct data and return new id", async () => {
      const memberData = {
        firstName: "Test",
        lastName: "User",
        email: "test@user.com",
        status: "active",
        phone: "123456789",
      } as Omit<Member, "id" | "name" | "registrationDate" | "updatedAt">;

      const newId = await addMember(memberData);

      expect(addDoc).toHaveBeenCalledWith(
        mockCollectionRef,
        expect.objectContaining({
          firstName: "Test",
          lastName: "User",
          email: "test@user.com",
          status: "active",
          phone: "123456789",
        })
      );
      expect(newId).toBe("123");
    });
  });

  describe("updateMember", () => {
    it("should call updateDoc with correct id and data", async () => {
      const memberId = "member1";
      const updates: Partial<MemberFormData> = {
        skillLevel: "advanced",
      };

      await updateMember(memberId, updates);

      expect(doc).toHaveBeenCalledWith(mockCollectionRef, memberId);
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining(updates)
      );
    });
  });

  describe("deleteMember", () => {
    it("should call deleteDoc with correct id", async () => {
      const memberId = "member1";

      await deleteMember(memberId);

      expect(doc).toHaveBeenCalledWith(mockCollectionRef, memberId);
      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });
  });

  describe("calculateAgeGroup", () => {
    // Контролираме времето, за да са предвидими тестовете
    beforeEach(() => {
      vi.useFakeTimers();
      // Задаваме "днешна" дата, за да не се променят резултатите с времето
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return null for null, undefined or invalid date input", () => {
      expect(calculateAgeGroup(null)).toBeNull();
      expect(calculateAgeGroup(undefined)).toBeNull();
      expect(calculateAgeGroup("not a real date")).toBeNull();
    });

    it('should return "U9" for age difference <= 8', () => {
      // Роден 2016 -> става на 8 през 2024
      expect(calculateAgeGroup("2016-05-10")).toBe("U9");
      // Роден 2017 -> става на 7 през 2024
      expect(calculateAgeGroup("2017-01-01")).toBe("U9");
    });

    it('should return "U11" for age difference 9 or 10', () => {
      // Роден 2015 -> става на 9 през 2024
      expect(calculateAgeGroup("2015-12-31")).toBe("U11");
      // Роден 2014 -> става на 10 през 2024
      expect(calculateAgeGroup("2014-01-01")).toBe("U11");
    });

    it('should return "U13" for age difference 11 or 12', () => {
      // Роден 2013 -> става на 11 през 2024
      expect(calculateAgeGroup("2013-01-01")).toBe("U13");
      // Роден 2012 -> става на 12 през 2024
      expect(calculateAgeGroup("2012-01-01")).toBe("U13");
    });

    it('should return "U15" for age difference 13 or 14', () => {
      // Роден 2011 -> става на 13 през 2024
      expect(calculateAgeGroup("2011-01-01")).toBe("U15");
      // Роден 2010 -> става на 14 през 2024
      expect(calculateAgeGroup("2010-01-01")).toBe("U15");
    });

    it('should return "U17" for age difference 15 or 16', () => {
      // Роден 2009 -> става на 15 през 2024
      expect(calculateAgeGroup("2009-01-01")).toBe("U17");
      // Роден 2008 -> става на 16 през 2024
      expect(calculateAgeGroup("2008-01-01")).toBe("U17");
    });

    it('should return "U19" for age difference 17 or 18', () => {
      // Роден 2007 -> става на 17 през 2024
      expect(calculateAgeGroup("2007-01-01")).toBe("U19");
      // Роден 2006 -> става на 18 през 2024
      expect(calculateAgeGroup("2006-01-01")).toBe("U19");
    });

    it('should return "Мъже/Жени" for age difference >= 19', () => {
      // Роден 2005 -> става на 19 през 2024
      expect(calculateAgeGroup("2005-01-01")).toBe("Мъже/Жени");
      // Роден 1990 -> става на 34 през 2024
      expect(calculateAgeGroup("1990-01-01")).toBe("Мъже/Жени");
    });
  });
});
