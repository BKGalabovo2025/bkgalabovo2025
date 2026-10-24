import { describe, expect, it } from "vitest";

import {
  DOCUMENT_TITLES,
  DocumentRequestStatusEnum,
  DocumentTypeEnum,
  ParentDataSchema,
} from "@/types/document-request.types";

describe("Document Requests Validation and Types", () => {
  describe("ParentDataSchema", () => {
    it("validates valid parent data successfully", () => {
      const validData = {
        parentName: "Петър Иванов",
        parentPhone: "0888123456",
        parentEmail: "petar@example.com",
        parentAddress: "гр. Гълъбово, ул. Хан Аспарух 1",
        agreedToRules: true,
        agreedToGdpr: true,
      };

      const result = ParentDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parentName).toBe("Петър Иванов");
        expect(result.data.parentPhone).toBe("0888123456");
      }
    });

    it("rejects empty parentName", () => {
      const invalidData = {
        parentName: "",
        parentPhone: "0888123456",
      };

      const result = ParentDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects empty parentPhone", () => {
      const invalidData = {
        parentName: "Мария Георгиева",
        parentPhone: "",
      };

      const result = ParentDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("allows empty or omitted optional email", () => {
      const dataWithoutEmail = {
        parentName: "Мария Георгиева",
        parentPhone: "0888123456",
        parentEmail: "",
      };

      const result = ParentDataSchema.safeParse(dataWithoutEmail);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email formats", () => {
      const invalidEmailData = {
        parentName: "Мария Георгиева",
        parentPhone: "0888123456",
        parentEmail: "not-an-email",
      };

      const result = ParentDataSchema.safeParse(invalidEmailData);
      expect(result.success).toBe(false);
    });
  });

  describe("Document Types & Titles", () => {
    it("has Bulgarian titles mapped for all document types", () => {
      const expectedTypes = [
        "membershipApplication",
        "signedDeclaration",
        "safetyInstruction",
        "travelDeclaration",
        "internalRules",
        "terminationRequest",
      ] as const;

      for (const docType of expectedTypes) {
        expect(DOCUMENT_TITLES[docType]).toBeDefined();
        expect(typeof DOCUMENT_TITLES[docType]).toBe("string");
        expect(DOCUMENT_TITLES[docType].length).toBeGreaterThan(3);
      }
    });

    it("validates document types enum", () => {
      expect(DocumentTypeEnum.safeParse("membershipApplication").success).toBe(
        true
      );
      expect(DocumentTypeEnum.safeParse("internalRules").success).toBe(true);
      expect(DocumentTypeEnum.safeParse("invalidDocType").success).toBe(false);
    });

    it("validates document request statuses", () => {
      expect(DocumentRequestStatusEnum.safeParse("pending").success).toBe(true);
      expect(DocumentRequestStatusEnum.safeParse("completed").success).toBe(
        true
      );
      expect(DocumentRequestStatusEnum.safeParse("expired").success).toBe(true);
      expect(DocumentRequestStatusEnum.safeParse("cancelled").success).toBe(
        true
      );
      expect(DocumentRequestStatusEnum.safeParse("unknown").success).toBe(
        false
      );
    });
  });
});
