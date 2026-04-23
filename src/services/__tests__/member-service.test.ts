import { describe, it, expect, vi, afterEach } from "vitest";
import {
  docToMember,
  addMember,
  updateMember,
  deleteMember,
} from "../member-service";
import {
  DocumentSnapshot,
  Timestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";
import { Member, MemberFormData } from "@/types/member.types";
import { getMembersCollection } from "@/lib/firebase-collections";

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
        rating: 1500,
        status: "active",
      };

      const doc = mockDoc("member1", data);
      const result = docToMember(doc);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("member1");
      expect(result?.name).toBe("John Doe");
      expect(result?.dateOfBirth).toBe(mockDate.toISOString());
      expect(result?.skillLevel).toBe("intermediate");
      expect(result?.rating).toBe(1500);
    });

    it("should handle missing fields with defaults", () => {
      const data = {
        firstName: "Jane",
        lastName: "Doe",
        status: "active",
      };

      const doc = mockDoc("member2", data);
      const result = docToMember(doc);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Jane Doe");
      expect(result?.skillLevel).toBeNull();
      expect(result?.rating).toBeNull();
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
        rating: 1600,
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
});
