import { describe, expect, it } from "vitest";

import { BusinessTripSchema } from "../types/business-trip.types";
import { MemberSchema } from "../types/member.types";

describe("Business Trip Signatures & Athlete Individual Signing", () => {
  const baseTripData = {
    siteId: "bkgalabovo",
    title: "Държавно първенство по бадминтон",
    destination: "гр. Стара Загора",
    startDate: "2026-04-10T08:00:00.000Z",
    endDate: "2026-04-12T18:00:00.000Z",
    coachId: "coach_1",
    participantsIds: ["athlete_1", "athlete_2", "athlete_3"],
    transportType: "club_paid" as const,
    financials: {
      perDiemRateEUR: 22,
      accommodationRateEUR: 40,
      isCommercialActivity: false,
    },
    status: "approved" as const,
  };

  it("should parse trip without signatures (backwards compatibility)", () => {
    const parsed = BusinessTripSchema.parse(baseTripData);
    expect(parsed.signatures).toBeUndefined();
    expect(parsed.signingTokens).toBeUndefined();
  });

  it("should parse trip with coach and chairman signatures", () => {
    const tripWithSignatures = {
      ...baseTripData,
      signatures: {
        coach: "data:image/png;base64,coachSignatureFakeData",
        chairman: "data:image/png;base64,chairmanSignatureFakeData",
      },
    };

    const parsed = BusinessTripSchema.parse(tripWithSignatures);
    expect(parsed.signatures?.coach).toBe(
      "data:image/png;base64,coachSignatureFakeData"
    );
    expect(parsed.signatures?.chairman).toBe(
      "data:image/png;base64,chairmanSignatureFakeData"
    );
    expect(parsed.signatures?.athletes).toBeUndefined();
  });

  it("should parse and validate individual athlete signatures in blue ink data", () => {
    const tripWithAthleteSignatures = {
      ...baseTripData,
      signatures: {
        coach: "data:image/png;base64,coachSig",
        chairman: "data:image/png;base64,chairSig",
        athletes: {
          athlete_1: "data:image/png;base64,athleteOneBlueSig",
          athlete_2: "data:image/png;base64,athleteTwoBlueSig",
        },
      },
      signingTokens: {
        athlete_1: {
          token: "token-uuid-1",
          memberId: "athlete_1",
          memberName: "Георги Иванов",
          role: "Състезател",
          createdAt: "2026-04-01T10:00:00.000Z",
        },
        athlete_2: {
          token: "token-uuid-2",
          memberId: "athlete_2",
          memberName: "Мария Петрова",
          role: "Състезател",
          createdAt: "2026-04-01T10:05:00.000Z",
        },
      },
    };

    const parsed = BusinessTripSchema.parse(tripWithAthleteSignatures);
    expect(parsed.signatures?.athletes?.["athlete_1"]).toBe(
      "data:image/png;base64,athleteOneBlueSig"
    );
    expect(parsed.signatures?.athletes?.["athlete_2"]).toBe(
      "data:image/png;base64,athleteTwoBlueSig"
    );
    expect(parsed.signatures?.athletes?.["athlete_3"]).toBeUndefined();
    expect(parsed.signingTokens?.["athlete_1"]?.token).toBe("token-uuid-1");
  });

  it("should match person signature correctly in statement row extraction", () => {
    const signatures = {
      coach: "data:image/png;base64,coachSig",
      chairman: "data:image/png;base64,chairSig",
      athletes: {
        member_101: "data:image/png;base64,member101Sig",
      },
    };

    const getPersonSig = (ovKey: string) => {
      return ovKey === "coach"
        ? signatures.coach
        : signatures.athletes[ovKey as keyof typeof signatures.athletes];
    };

    expect(getPersonSig("coach")).toBe("data:image/png;base64,coachSig");
    expect(getPersonSig("member_101")).toBe(
      "data:image/png;base64,member101Sig"
    );
    expect(getPersonSig("member_999")).toBeUndefined();
  });

  it("should validate member schema with stored signature and signatureUpdatedAt", () => {
    const validMember = {
      id: "mem_zhivko",
      siteId: "bkgalabovo",
      firstName: "Живко",
      lastName: "Иванов",
      name: "Живко Иванов",
      registrationDate: "2026-01-01T00:00:00.000Z",
      signature: "data:image/png;base64,zhivkoBlueOfficialSignature",
      signatureUpdatedAt: "2026-11-11T12:00:00.000Z",
    };

    const parsed = MemberSchema.parse(validMember);
    expect(parsed.signature).toBe(
      "data:image/png;base64,zhivkoBlueOfficialSignature"
    );
    expect(parsed.signatureUpdatedAt).toBe("2026-11-11T12:00:00.000Z");
  });

  it("should auto-fill athlete signatures for participants with stored profile signatures", () => {
    const mockMembersDict: Record<string, { signature?: string }> = {
      zhivko: { signature: "data:image/png;base64,zhivkoSig" },
      petar: { signature: undefined },
      ivan: { signature: "data:image/png;base64,ivanSig" },
    };

    const participantsIds = ["zhivko", "petar", "ivan"];
    const existingSignatures: Record<string, string> = {};

    // Simulation of prefill logic
    participantsIds.forEach((id) => {
      if (!existingSignatures[id]) {
        const storedSig = mockMembersDict[id]?.signature;
        if (storedSig) {
          existingSignatures[id] = storedSig;
        }
      }
    });

    expect(existingSignatures["zhivko"]).toBe(
      "data:image/png;base64,zhivkoSig"
    );
    expect(existingSignatures["ivan"]).toBe("data:image/png;base64,ivanSig");
    expect(existingSignatures["petar"]).toBeUndefined();
  });

  it("should resolve Mira Georgieva's signature across all roles (Chairman, Coach, Athlete)", () => {
    const miraSig = "data:image/png;base64,miraOfficialBase64Sig";
    const mockMembersDict: Record<
      string,
      { id: string; firstName: string; lastName: string; signature?: string }
    > = {
      "2kNiT9VeLWOnK8kpnSsR": {
        id: "2kNiT9VeLWOnK8kpnSsR",
        firstName: "Мира",
        lastName: "Георгиева",
        signature: miraSig,
      },
      athlete_1: {
        id: "athlete_1",
        firstName: "Петър",
        lastName: "Стоянов",
        signature: "data:image/png;base64,petarSig",
      },
    };

    const trip = {
      coachName: "Мира Георгиева",
      coachIsAthlete: true,
      signatures: {
        chairman: miraSig,
        coach: undefined, // omitted, should resolve via fallback
        athletes: {
          athlete_1: "data:image/png;base64,petarSig",
        },
      },
    };

    // Master resolution logic matching BusinessTripPdfTemplates.tsx
    const miraMember = Object.values(mockMembersDict).find(
      (m) =>
        (m.firstName?.trim() === "Мира" &&
          m.lastName?.trim() === "Георгиева") ||
        m.id === "2kNiT9VeLWOnK8kpnSsR"
    );
    const resolvedMiraSig =
      miraMember?.signature ||
      trip.signatures?.chairman ||
      trip.signatures?.coach;

    const isCoachMira = (trip.coachName || "").toLowerCase().includes("мира");
    const effectiveChairmanSig =
      trip.signatures?.chairman ||
      (isCoachMira ? trip.signatures?.coach : undefined);
    const effectiveCoachSig =
      trip.signatures?.coach ||
      (isCoachMira ? resolvedMiraSig || trip.signatures?.chairman : undefined);

    expect(effectiveChairmanSig).toBe(miraSig);
    expect(effectiveCoachSig).toBe(miraSig);

    // Test statement person row resolution
    const resolvePersonSig = (p: { name: string; ovKey: string }) => {
      const isPersonMira =
        (p.name || "").toLowerCase().includes("мира") ||
        p.ovKey === "2kNiT9VeLWOnK8kpnSsR" ||
        (miraMember && p.ovKey === miraMember.id);

      return p.ovKey === "coach"
        ? effectiveCoachSig
        : (trip.signatures?.athletes as Record<string, string>)?.[p.ovKey] ||
            (isPersonMira
              ? resolvedMiraSig || effectiveCoachSig || effectiveChairmanSig
              : undefined);
    };

    // Coach row
    expect(resolvePersonSig({ name: "Мира Георгиева", ovKey: "coach" })).toBe(
      miraSig
    );
    // Athlete row when Mira is listed as athlete
    expect(
      resolvePersonSig({
        name: "Мира Георгиева",
        ovKey: "2kNiT9VeLWOnK8kpnSsR",
      })
    ).toBe(miraSig);
    // Other athlete row
    expect(
      resolvePersonSig({ name: "Петър Стоянов", ovKey: "athlete_1" })
    ).toBe("data:image/png;base64,petarSig");
  });
});
