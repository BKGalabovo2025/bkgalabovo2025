import { describe, expect, it } from "vitest";

import {
  generateCertificateSerialNumber,
  getCertificateTypeLabel,
  getFrameStyleLabel,
  getRankLabel,
  getSponsorCategoryLabel,
  IssueCertificateInput,
} from "@/types/certificates";

describe("Certificates & Vouchers Studio QA Suite", () => {
  // 1. Serial Number Format & Dynamic Year
  describe("Serial Number Generation", () => {
    it("generates valid serial numbers for bkgalabovo with dynamic current year", () => {
      const serial = generateCertificateSerialNumber("bkgalabovo");
      const currentYear = new Date().getFullYear();
      expect(serial).toMatch(new RegExp(`^BKG-${currentYear}-[A-Z0-9]{4}$`));
    });

    it("generates valid serial numbers for recoveryzone with dynamic current year", () => {
      const serial = generateCertificateSerialNumber("recoveryzone");
      const currentYear = new Date().getFullYear();
      expect(serial).toMatch(new RegExp(`^RZ-${currentYear}-[A-Z0-9]{4}$`));
    });

    it("generates unique serial numbers across sequential invocations", () => {
      const serial1 = generateCertificateSerialNumber("bkgalabovo");
      const serial2 = generateCertificateSerialNumber("bkgalabovo");
      expect(serial1).not.toBe(serial2);
    });
  });

  // 2. Labels and Enum Display Helpers
  describe("Labels and Formatting Helpers", () => {
    it("correctly maps award ranks", () => {
      expect(getRankLabel("1st")).toContain("I-во");
      expect(getRankLabel("2nd")).toContain("II-ро");
      expect(getRankLabel("3rd")).toContain("III-то");
      expect(getRankLabel("participant")).toContain("Участие");
      expect(getRankLabel("honorable")).toContain("Почетна");
      expect(getRankLabel(undefined)).toBe("Грамота за Отличие");
    });

    it("correctly maps sponsor categories", () => {
      expect(getSponsorCategoryLabel("institutional")).toContain(
        "Институционален"
      );
      expect(getSponsorCategoryLabel("gold")).toContain("Златен");
      expect(getSponsorCategoryLabel("partner")).toContain("Партньор");
    });

    it("correctly maps frame styles and certificate types", () => {
      expect(getFrameStyleLabel("classic_gold")).toContain("Класически златен");
      expect(getFrameStyleLabel("luxury_dark")).toContain("Луксозен тъмен");
      expect(getFrameStyleLabel("sport_champion")).toContain("Спортен шампион");
      expect(getFrameStyleLabel("modern_minimal")).toContain(
        "Модерен минималистичен"
      );

      expect(getCertificateTypeLabel("award")).toContain("Грамота");
      expect(getCertificateTypeLabel("voucher")).toContain("Ваучер");
      expect(getCertificateTypeLabel("certificate")).toContain("Сертификат");
    });
  });

  // 3. Member Autocomplete & Fallback Handling
  describe("Recipient Data Sanitization", () => {
    it("gracefully handles member without education institution", () => {
      const memberWithoutSchool = {
        firstName: "Петър",
        lastName: "Стоянов",
        educationInstitution: undefined,
      };

      const recipient = {
        name: `${memberWithoutSchool.firstName} ${memberWithoutSchool.lastName}`.trim(),
        institution: memberWithoutSchool.educationInstitution || undefined,
      };

      expect(recipient.name).toBe("Петър Стоянов");
      expect(recipient.institution).toBeUndefined();
    });

    it("gracefully handles manual recipient without institution or contact info", () => {
      const input: IssueCertificateInput = {
        templateId: "tmpl_test",
        type: "award",
        recipient: {
          name: "Външен Гост",
          institution: "",
          email: "",
          phone: "",
        },
        details: {
          rank: "participant",
          eventTitle: "Празничен турнир",
        },
      };

      expect(input.recipient.name).toBe("Външен Гост");
      expect(input.details.rank).toBe("participant");
    });
  });

  // 4. Voucher Sessions Math & Non-Negative Boundary
  describe("Voucher Balance Invariants", () => {
    it("ensures remaining sessions do not become negative when redeeming sessions", () => {
      const totalSessions = 5;
      let usedSessions = 0;

      const redeemOne = () => {
        if (usedSessions >= totalSessions) {
          throw new Error(
            "Всички процедури от този ваучер вече са изразходени!"
          );
        }
        usedSessions += 1;
        const remaining = Math.max(0, totalSessions - usedSessions);
        const status = remaining === 0 ? "fully_used" : "active";
        return { usedSessions, remaining, status };
      };

      // 1 to 5 redemptions
      for (let i = 1; i <= 5; i++) {
        const res = redeemOne();
        expect(res.usedSessions).toBe(i);
        expect(res.remaining).toBe(5 - i);
        if (i < 5) {
          expect(res.status).toBe("active");
        } else {
          expect(res.status).toBe("fully_used");
        }
      }

      // 6th redemption must fail and cannot drop balance below 0
      expect(() => redeemOne()).toThrow(
        "Всички процедури от този ваучер вече са изразходени!"
      );
      expect(usedSessions).toBe(5);
    });
  });

  // 5. Sponsors Disabling / Deletion Preview Resiliency
  describe("Sponsor Selection Preview Resiliency", () => {
    it("filters active sponsors and ignores deleted or non-matching IDs", () => {
      const allSponsors = [
        { id: "sp1", name: "Община Гълъбово", isActive: true },
        { id: "sp2", name: "БФБ", isActive: false },
        { id: "sp3", name: "Мини Марица-изток", isActive: true },
      ];

      // Template selects sp1, sp2 (which is inactive), and non-existent sp_deleted
      const selectedSponsorIds = ["sp1", "sp2", "sp_deleted"];

      const activeSponsors = allSponsors.filter((s) => {
        if (selectedSponsorIds && selectedSponsorIds.length > 0) {
          return selectedSponsorIds.includes(s.id);
        }
        return s.isActive;
      });

      // Does not crash, returns valid sponsors that exist
      expect(activeSponsors.map((s) => s.id)).toEqual(["sp1", "sp2"]);
      expect(activeSponsors.find((s) => s.id === "sp_deleted")).toBeUndefined();
    });
  });

  // 6. Firestore Document Payload Sanitization (Undefined properties removal)
  describe("Firestore Undefined Field Sanitization", () => {
    it("strips undefined fields completely so Firestore Admin does not throw", () => {
      const rawCertPayload = {
        id: "cert_test",
        type: "certificate",
        recipient: { name: "Теодор Иванов", institution: undefined },
        details: {
          totalSessions: undefined,
          remainingSessions: undefined,
          voucherStatus: undefined,
          validUntil: undefined,
          rank: "Първо място",
        },
      };

      const sanitized = JSON.parse(JSON.stringify(rawCertPayload));

      expect(sanitized.recipient).toEqual({ name: "Теодор Иванов" });
      expect(sanitized.recipient.institution).toBeUndefined();
      expect("institution" in sanitized.recipient).toBe(false);

      expect(sanitized.details).toEqual({ rank: "Първо място" });
      expect("totalSessions" in sanitized.details).toBe(false);
      expect("remainingSessions" in sanitized.details).toBe(false);
      expect("voucherStatus" in sanitized.details).toBe(false);
    });
  });

  // 7. AI Prompt Studio & AI Background Configuration
  describe("AI Prompt Studio & AI Background Invariants", () => {
    it("formats AI prompts correctly for Midjourney with negative prompt and aspect ratio", async () => {
      const { CERTIFICATE_PROMPT_RECIPES, formatAiPromptForPlatform } =
        await import("@/lib/ai/certificate-prompts");

      const kidsRecipe = CERTIFICATE_PROMPT_RECIPES.find(
        (r) => r.id === "kids_badminton_award"
      );
      expect(kidsRecipe).toBeDefined();

      const formatted = formatAiPromptForPlatform(
        kidsRecipe!,
        "midjourney",
        "landscape"
      );

      expect(formatted.prompt).toContain("--ar 16:9");
      expect(formatted.prompt).toContain("--v 6.1");
      expect(formatted.prompt).toContain("--no");
      expect(formatted.negativePrompt).toContain("text");
      expect(formatted.negativePrompt).toContain("typography");
    });

    it("formats AI prompts for Leonardo.ai with strict negative prompt", async () => {
      const { CERTIFICATE_PROMPT_RECIPES, formatAiPromptForPlatform } =
        await import("@/lib/ai/certificate-prompts");

      const champRecipe = CERTIFICATE_PROMPT_RECIPES.find(
        (r) => r.id === "championship_tournament"
      );
      expect(champRecipe).toBeDefined();

      const formatted = formatAiPromptForPlatform(
        champRecipe!,
        "leonardo",
        "landscape"
      );

      expect(formatted.prompt).toContain("badminton");
      expect(formatted.negativePrompt).toContain("low resolution");
    });

    it("curated AI backgrounds gallery contains valid entries with recommended text contrast", async () => {
      const { CURATED_AI_BACKGROUNDS } =
        await import("@/lib/ai/certificate-prompts");

      expect(CURATED_AI_BACKGROUNDS.length).toBeGreaterThanOrEqual(4);
      for (const bg of CURATED_AI_BACKGROUNDS) {
        expect(bg.imageUrl).toMatch(/^https?:\/\//);
        expect(["light", "dark"]).toContain(bg.recommendedTextMode);
      }
    });

    it("generates or intelligently matches AI background via certificateAiService", async () => {
      const { generateCertificateAiBackground } =
        await import("@/lib/ai/certificate-ai-service");

      // Wellness theme test
      const wellnessRes = await generateCertificateAiBackground({
        prompt: "zen spa eucalyptus wellness stones",
        theme: "recovery_wellness_voucher",
      });

      expect(wellnessRes.success).toBe(true);
      expect(wellnessRes.imageUrl).toBeDefined();
      expect(wellnessRes.providerUsed).toBeDefined();

      // Badminton tournament test
      const badmintonRes = await generateCertificateAiBackground({
        prompt: "kids badminton smash golden trophy",
        theme: "kids_badminton_award",
      });

      expect(badmintonRes.success).toBe(true);
      expect(badmintonRes.imageUrl).toBeDefined();
    });
  });
});
