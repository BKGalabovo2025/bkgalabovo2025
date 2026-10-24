import { describe, expect, it } from "vitest";

import {
  CreateDocumentTemplateInputSchema,
  DOCUMENT_CATEGORY_LABELS,
  DocumentTemplateCategoryEnum,
  DocumentTemplateSchema,
} from "@/types/document-template.types";

describe("Document Templates Schemas and Versioning", () => {
  describe("DocumentTemplateSchema", () => {
    it("validates a full official document template", () => {
      const template = {
        id: "internalRules",
        slug: "internalRules",
        title: "Вътрешен правилник на клуба",
        description: "Официален вътрешен правилник",
        category: "internal_rules",
        version: 1,
        content: "I. Общи положения...",
        fileUrl: null,
        fileName: null,
        fileType: null,
        fileSize: null,
        isRequiredForMember: true,
        isActive: true,
        createdAt: "2026-10-22T20:00:00.000Z",
        updatedAt: "2026-10-22T20:00:00.000Z",
      };

      const result = DocumentTemplateSchema.safeParse(template);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(1);
        expect(result.data.isRequiredForMember).toBe(true);
      }
    });

    it("enforces version number to be an integer >= 1", () => {
      const invalidVersion = {
        id: "tpl_1",
        slug: "tpl_1",
        title: "Бланка",
        content: "Текст",
        version: 0, // Must be >= 1
        createdAt: "2026-10-22T20:00:00.000Z",
        updatedAt: "2026-10-22T20:00:00.000Z",
      };

      const result = DocumentTemplateSchema.safeParse(invalidVersion);
      expect(result.success).toBe(false);
    });

    it("verifies version incrementation preserves history", () => {
      const v1 = {
        id: "travelDeclaration",
        slug: "travelDeclaration",
        title: "Съгласие за пътуване",
        version: 1,
        content: "Текст вариант 1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        isRequiredForMember: true,
        isActive: true,
      };

      const v2 = {
        ...v1,
        version: v1.version + 1,
        content: "Текст вариант 2 (обновен)",
        updatedAt: "2026-10-22T00:00:00.000Z",
      };

      expect(v2.version).toBe(2);
      expect(v1.content).not.toBe(v2.content);
      expect(DocumentTemplateSchema.safeParse(v2).success).toBe(true);
    });
  });

  describe("CreateDocumentTemplateInputSchema", () => {
    it("validates valid input for a custom template", () => {
      const input = {
        title: "Декларация за турнир",
        category: "declarations" as const,
        content: "Съгласие за участие в регионален турнир...",
        description: "За състезания извън гр. Гълъбово",
        isRequiredForMember: true,
        isActive: true,
      };

      const result = CreateDocumentTemplateInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects empty content", () => {
      const invalid = {
        title: "Декларация за турнир",
        content: "",
      };

      const result = CreateDocumentTemplateInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("DOCUMENT_CATEGORY_LABELS", () => {
    it("maps all category enums to human readable Bulgarian labels", () => {
      const categories = DocumentTemplateCategoryEnum.options;
      for (const cat of categories) {
        expect(DOCUMENT_CATEGORY_LABELS[cat]).toBeDefined();
        expect(DOCUMENT_CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
      }
    });
  });
});
