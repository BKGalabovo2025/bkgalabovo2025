import { describe, expect, it } from "vitest";

import {
  detectAmount,
  detectDocumentNumber,
  detectExpenseType,
  detectSupplierName,
  normalizeDate,
  parseExpenseText,
  parseNraQrCode,
} from "../lib/expense-document-parser";

describe("Expense Document Parser (NRA QR & OCR)", () => {
  describe("parseNraQrCode", () => {
    it("should parse standard NRA fiscal QR code URL format", () => {
      const qrUrl =
        "https://nra.bg/check-receipt?fn=1234567&dt=2026-10-15&sum=125.50";
      const parsed = parseNraQrCode(qrUrl);
      expect(parsed).not.toBeNull();
      expect(parsed?.amountBGN).toBeCloseTo(125.5, 2);
      expect(parsed?.documentNumber).toBe("1234567");
      expect(parsed?.documentDate).toBe("2026-10-15");
      expect(parsed?.source).toBe("qr_nra");
      expect(parsed?.amountEUR).toBeCloseTo(64.17, 2);
    });

    it("should parse asterisk-separated Bulgarian fiscal memory QR code", () => {
      const qrRaw = "FM12345678*FN0098765*DT2026-10-20*TM14:30:00*BL84.30";
      const parsed = parseNraQrCode(qrRaw);
      expect(parsed).not.toBeNull();
      expect(parsed?.amountBGN).toBeCloseTo(84.3, 2);
      expect(parsed?.documentNumber).toBe("0098765");
      expect(parsed?.documentDate).toBe("2026-10-20");
    });

    it("should return null for invalid or empty QR codes", () => {
      expect(parseNraQrCode("")).toBeNull();
      expect(parseNraQrCode("test")).toBeNull();
    });
  });

  describe("detectSupplierName", () => {
    it("should identify major fuel providers", () => {
      expect(detectSupplierName("БЕЛЕЖКА ЛУКОЙЛ БЪЛГАРИЯ А-95")).toBe(
        "Лукойл България ЕООД"
      );
      expect(detectSupplierName("SHELL БЪЛГАРИЯ КАРТА ДИЗЕЛ")).toBe(
        "Шел България ЕАД"
      );
      expect(detectSupplierName("OMV STARA ZAGORA")).toBe("ОМВ България ООД");
      expect(detectSupplierName("БЕНЗИНОСТАНЦИЯ ПЕТРОЛ")).toBe("Петрол АД");
    });

    it("should identify hotel and accommodation names", () => {
      expect(detectSupplierName("Хотел Тримонциум Пловдив")).toContain(
        "Хотел Тримонциум"
      );
    });

    it("should identify road toll and sports federations", () => {
      expect(detectSupplierName("Електронна винетка BGTOLL АПИ")).toBe(
        "Агенция Пътна Инфраструктура (БГТОЛ)"
      );
      expect(detectSupplierName("БФ Бадминтон Такса")).toBe(
        "Българска Федерация Бадминтон"
      );
    });
  });

  describe("detectDocumentNumber", () => {
    it("should extract 10-digit Bulgarian invoice numbers", () => {
      expect(detectDocumentNumber("ФАКТУРА № 0100456789")).toBe("0100456789");
      expect(
        detectDocumentNumber("Оригинал Ф-ра: 1200045678 от дата 15.10.2026")
      ).toBe("1200045678");
    });

    it("should extract fiscal slip numbers", () => {
      expect(detectDocumentNumber("ФИСКАЛЕН БОН №: 004567")).toBe("004567");
    });
  });

  describe("detectAmount", () => {
    it("should prioritize total amount line", () => {
      const text = `
        ЛУКОЙЛ БЪЛГАРИЯ
        А-95 30.00 л * 2.65 лв/л = 79.50
        ОБЩО ДЪЛЖИМА СУМА: 79.50 лв.
        В БРОЙ: 100.00 лв.
        РЕСТО: 20.50 лв.
      `;
      expect(detectAmount(text)).toBeCloseTo(79.5, 2);
    });
  });

  describe("detectExpenseType", () => {
    it("should classify fuel, accommodation, and tolls accurately", () => {
      expect(detectExpenseType("Зареждане Дизел 40 литра")).toBe("fuel");
      expect(detectExpenseType("Нощувка в хотел 2 легла")).toBe(
        "accommodation"
      );
      expect(detectExpenseType("Електронна винетка BGTOLL")).toBe("toll");
      expect(detectExpenseType("Такса участие в ДЛШ Бадминтон")).toBe(
        "entry_fee"
      );
    });
  });

  describe("normalizeDate", () => {
    it("should convert DD.MM.YYYY to YYYY-MM-DD", () => {
      expect(normalizeDate("Дата: 15.10.2026 г.")).toBe("2026-10-15");
      expect(normalizeDate("2026-11-05")).toBe("2026-11-05");
    });
  });

  describe("parseExpenseText full pipeline", () => {
    it("should extract complete expense object from receipt text", () => {
      const receipt = `
        "ЛУКОЙЛ БЪЛГАРИЯ" ЕООД
        ФИСКАЛЕН БОН № 003456
        Дата: 18.10.2026 12:45
        БЕНЗИН А-95  40.00L x 2.70
        ОБЩО СУМА: 108.00 ЛВ
      `;
      const result = parseExpenseText(receipt);
      expect(result.supplierName).toBe("Лукойл България ЕООД");
      expect(result.documentNumber).toBe("003456");
      expect(result.documentDate).toBe("2026-10-18");
      expect(result.amountBGN).toBeCloseTo(108.0, 2);
      expect(result.expenseType).toBe("fuel");
      expect(result.amountEUR).toBeCloseTo(55.22, 2);
    });
  });
});
