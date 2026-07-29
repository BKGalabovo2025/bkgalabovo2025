import { describe, it, expect, beforeEach } from "vitest";
import "./setup"; 
import { clearFirestore, db } from "./setup";
import { tournamentService } from "@/services/tournament-service";
import { doc, setDoc } from "firebase/firestore";

describe("Tournament Integration Tests (Emulator)", () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  it("should create a tournament, read it back, and validate via Zod mappers", async () => {
    const siteId = "bkgalabovo";
    const tData = {
      title: "Integration Tournament",
      status: "upcoming" as const,
      format: "knockout" as const,
      startDate: new Date("2026-09-01T10:00:00Z").toISOString(),
      endDate: new Date("2026-09-02T18:00:00Z").toISOString(),
      location: "Sofia",
      categories: ["singles", "doubles"] as Array<"singles" | "doubles" | "mixed">,
      matchFormatId: "best_of_3",
      countsForRanking: true,
      pointsMultiplier: 1,
      entryFee: 15,
      siteId,
    };

    // 1. Create using the service
    const id = await tournamentService.createTournament(tData);
    expect(id).toBeDefined();

    // 2. Read back using the service
    const tournaments = await tournamentService.getTournaments();
    
    expect(tournaments).toHaveLength(1);
    const t = tournaments[0];
    expect(t.id).toBe(id);
    expect(t.title).toBe("Integration Tournament");
    expect(t.categories).toContain("singles");
  });

  it("should filter out invalid tournaments directly inserted to DB", async () => {
    const invalidData = {
      title: "Bad Tournament", 
      // missing status, startDate, endDate, etc.
    };

    // 1. Insert directly to DB bypassing the service validation
    const ref = doc(db, "tournaments", "invalid-id");
    await setDoc(ref, invalidData);

    // 2. Try to read it using the service
    const tournaments = await tournamentService.getTournaments();
    
    // Zod mapper mapDocToTournament should fail and filter it out
    expect(tournaments).toHaveLength(0); 
  });
});
