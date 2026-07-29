import { describe, it, expect, beforeEach } from "vitest";
import "./setup"; // Ensure vi.mock is applied
import { clearFirestore, db } from "./setup";
import { addMember, getAllMembers, getMemberById } from "@/services/member-service";
import { doc, setDoc } from "firebase/firestore";

describe("Member Integration Tests (Emulator)", () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  it("should create a member, read it back, and validate via Zod mappers", async () => {
    const siteId = "bkgalabovo";
    const memberData = {
      firstName: "Integration",
      lastName: "Test",
      status: "active" as const,
      gender: "male" as const,
      siteId,
    };

    // 1. Create using the service
    const id = await addMember(memberData);
    expect(id).toBeDefined();

    // 2. Read back using the service (which uses docToMember Zod mapper internally)
    const member = await getMemberById(id);
    
    expect(member).not.toBeNull();
    expect(member?.id).toBe(id);
    expect(member?.firstName).toBe("Integration");
    expect(member?.lastName).toBe("Test");
    expect(member?.name).toBe("Integration Test"); // Mapper logic
    expect(member?.siteId).toBe(siteId); // Ensure siteId is injected
  });

  it("should fail Zod validation if reading directly from DB with invalid data", async () => {
    const invalidData = {
      firstName: "Bad", // missing lastName, status, and siteId (required by schema)
    };

    // 1. Insert directly to DB bypassing the service validation
    const ref = doc(db, "members", "invalid-id");
    await setDoc(ref, invalidData);

    // 2. Try to read it using the service
    const members = await getAllMembers(true);
    
    // The mapper should return null and filter it out, or throw depending on how getMembers maps it.
    // In our codebase, docToMember returns null on Zod failure, and getMembers uses .filter(Boolean)
    const foundInvalid = members.find(m => m.id === "invalid-id");
    expect(foundInvalid).toBeUndefined(); // The invalid member was successfully filtered out
  });
});
