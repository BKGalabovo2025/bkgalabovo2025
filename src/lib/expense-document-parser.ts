import { convertBgnToEur } from "@/types/business-trip.types";

export interface ParsedExpenseData {
  amountBGN?: number;
  amountEUR?: number;
  supplierName?: string;
  documentNumber?: string;
  documentDate?: string; // YYYY-MM-DD
  expenseType?:
    "fuel" | "toll" | "accommodation" | "entry_fee" | "per_diem" | "other";
  rawText?: string;
  source: "qr_nra" | "ocr" | "pdf";
}

/**
 * Парсва QR код на касова бележка по Наредба Н-18 на НАП.
 * В България фискалните QR кодове съдържат структурирана информация:
 * - URL формат: https://nra.bg/... с параметри (fn=..., dt=..., sum=... или bl=...)
 * - Символен формат: FM12345678*FN0001234*DT2026-10-15*TM18:30:00*BL125.50
 * - Разделен със запетаи формат: <ФП>,<ФБ>,<Дата Час>,<Сума>
 */
export function parseNraQrCode(qrText: string): ParsedExpenseData | null {
  if (!qrText || typeof qrText !== "string") return null;
  const clean = qrText.trim();
  if (clean.length < 5) return null;

  let amountBGN: number | undefined;
  let documentNumber: string | undefined;
  let documentDate: string | undefined;

  // Формат 1: URL към НАП (nra.bg / check-receipt)
  if (
    clean.includes("http://") ||
    clean.includes("https://") ||
    clean.includes("nra.bg")
  ) {
    try {
      const url = new URL(
        clean.startsWith("http") ? clean : `https://${clean}`
      );
      const params = url.searchParams;

      // Търсене на сума: sum, bl, amount, total
      const rawSum =
        params.get("sum") ||
        params.get("bl") ||
        params.get("amount") ||
        params.get("total");
      if (rawSum) {
        const parsedSum = parseFloat(rawSum.replace(",", "."));
        if (!isNaN(parsedSum) && parsedSum > 0) amountBGN = parsedSum;
      }

      // Търсене на номер на документ: fn (фискален номер), receipt, doc
      const rawFn =
        params.get("fn") || params.get("receipt") || params.get("doc");
      if (rawFn) {
        documentNumber = rawFn.trim();
      }

      // Търсене на дата: dt, date
      const rawDt = params.get("dt") || params.get("date");
      if (rawDt) {
        documentDate = normalizeDate(rawDt);
      }
    } catch {
      // Продължаваме с текстово съвпадение, ако URL парсването не успее
    }
  }

  // Формат 2: Формат със звездички: FM12345678*FN0001234*DT2026-10-15*TM18:30:00*BL125.50
  if (clean.includes("*")) {
    const parts = clean.split("*");
    for (const part of parts) {
      const trimmed = part.trim();
      if (/^FN/iu.test(trimmed)) {
        documentNumber = trimmed.replace(/^FN/iu, "").trim();
      } else if (/^DT/iu.test(trimmed)) {
        const rawDate = trimmed.replace(/^DT/iu, "").trim();
        documentDate = normalizeDate(rawDate);
      } else if (/^BL/iu.test(trimmed) || /^SUM/iu.test(trimmed)) {
        const rawSum = trimmed
          .replace(/^(?:BL|SUM)/iu, "")
          .replace(",", ".")
          .trim();
        const parsedSum = parseFloat(rawSum);
        if (!isNaN(parsedSum) && parsedSum > 0) amountBGN = parsedSum;
      }
    }
  }

  // Формат 3: Обикновен списък, разделен със запетаи
  if (!amountBGN && clean.includes(",")) {
    const parts = clean.split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      const numMatch = trimmed.match(/^\d+[.,]\d{2}$/);
      if (numMatch && !amountBGN) {
        const parsed = parseFloat(numMatch[0].replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) amountBGN = parsed;
      }
      if (!documentDate) {
        const d = normalizeDate(trimmed);
        if (d) documentDate = d;
      }
    }
  }

  if (amountBGN || documentNumber || documentDate) {
    const amountEUR = amountBGN ? convertBgnToEur(amountBGN) : undefined;
    return {
      amountBGN,
      amountEUR,
      documentNumber,
      documentDate,
      source: "qr_nra",
    };
  }

  return null;
}

/**
 * Нормализира открита дата към стандартен формат YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const clean = dateStr.trim();

  // YYYY-MM-DD или YYYY/MM/DD
  const ymd = clean.match(
    /\b(20\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/
  );
  if (ymd) {
    return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  }

  // DD.MM.YYYY или DD/MM/YYYY
  const dmy = clean.match(
    /\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](20\d{2})\b/
  );
  if (dmy) {
    return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }

  return undefined;
}

/**
 * Разпознава името на доставчика/търговеца от текста
 */
export function detectSupplierName(text: string): string | undefined {
  if (!text) return undefined;

  // Известни вериги бензиностанции
  if (/лукойл|lukoil/iu.test(text)) return "Лукойл България ЕООД";
  if (/шел|shell/iu.test(text)) return "Шел България ЕАД";
  if (/омв|omv/iu.test(text)) return "ОМВ България ООД";
  if (/петрол|petrol/iu.test(text)) return "Петрол АД";
  if (/еко|eko\b/iu.test(text)) return "ЕКО България ЕАД";
  if (/газпром|gazprom/iu.test(text)) return "Газпром";
  if (/ромпетрол|rompetrol/iu.test(text)) return "Ромпетрол България ЕАД";
  if (/инса\s*ойл|insa\s*oil/iu.test(text)) return "Инса Ойл ООД";

  // Пътни такси / Тол
  if (/bgtoll|бгтол|тол\s*управление|риа|апи\b/iu.test(text)) {
    return "Агенция Пътна Инфраструктура (БГТОЛ)";
  }

  // Спортни организации
  if (/бф\s*бадминтон|българска\s*федерация\s*бадминтон/iu.test(text)) {
    return "Българска Федерация Бадминтон";
  }

  // Търсене на специфични хотели
  const hotelMatch = text.match(
    /(?:хотел|hotel|комплекс|complex|релакс|спа|spa)\s+[„"']?([A-Za-zА-Яа-я0-9\s\-–]+)[“"']?/iu
  );
  if (hotelMatch && hotelMatch[0]) {
    return hotelMatch[0].trim();
  }

  // Опит за извличане на фирма от първите редове на касовия бон (преди ЕИК/БУЛСТАТ)
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Игнорираме служебни думи
    if (/фискален|бон|касова|бележка|клиент|добре|дошли|receipt/iu.test(line))
      continue;
    if (
      /(?:еоод|оод|еад|ад|ет)\b/iu.test(line) ||
      /^[„"'].+[“"']$/.test(line)
    ) {
      return line.replace(/^[„"']|[“"']$/g, "").trim();
    }
  }

  return undefined;
}

/**
 * Разпознава номера на документа (фактура или фискален бон)
 */
export function detectDocumentNumber(text: string): string | undefined {
  if (!text) return undefined;

  // 1. Стандартен 10-цифрен номер на фактура в България (напр. 0100234567)
  const invMatch = text.match(/(?:фактура|ф-ра|invoice)[\s№#:]*(\d{10})/iu);
  if (invMatch && invMatch[1]) return invMatch[1];

  const generic10Digit = text.match(/\b(0\d{9}|1\d{9}|2\d{9})\b/);
  if (generic10Digit && generic10Digit[1]) return generic10Digit[1];

  // 2. Номер на фискален бон: "ФИСКАЛЕН БОН №: 001234" или "БОН № 1234"
  const bonMatch = text.match(/(?:бон|бележка|квитанция)[\s№#:]*(\d{4,8})\b/iu);
  if (bonMatch && bonMatch[1]) return bonMatch[1];

  // 3. Общ номер след №
  const numAfterHash = text.match(/№\s*(\d{4,10})/u);
  if (numAfterHash && numAfterHash[1]) return numAfterHash[1];

  return undefined;
}

/**
 * Разпознава сумата от текста на документа
 */
export function detectAmount(text: string): number | undefined {
  if (!text) return undefined;
  const lines = text.split("\n");
  let primaryAmount: number | undefined;
  let secondaryAmount: number | undefined;

  // Високоприоритетни ключови думи за крайна дължима сума
  const primaryKeywords = [
    "ОБЩО",
    "ДЪЛЖИМА СУМА",
    "КРАЙНА СУМА",
    "TOTAL",
    "ВСИЧКО",
    "ОБЩА СУМА",
    "СУМА ЗА ПЛАЩАНЕ",
  ];

  // Вторични (плащане)
  const secondaryKeywords = ["СУМА", "В БРОЙ", "КАРТА", "ПЛАТЕНО", "AMOUNT"];

  for (const line of lines) {
    const upper = line.toUpperCase();
    // Игнорираме реда с ресто
    if (upper.includes("РЕСТО") || upper.includes("CHANGE")) continue;

    const isPrimary = primaryKeywords.some((kw) => upper.includes(kw));
    const isSecondary = secondaryKeywords.some((kw) => upper.includes(kw));

    if (isPrimary || isSecondary) {
      const matches = line.match(/\b\d+[.,]\d{2}\b/g);
      if (matches) {
        for (const m of matches) {
          const val = parseFloat(m.replace(",", "."));
          if (!isNaN(val) && val > 0 && val < 50000) {
            if (isPrimary) {
              if (!primaryAmount || val > primaryAmount) {
                primaryAmount = val;
              }
            } else if (!secondaryAmount || val > secondaryAmount) {
              secondaryAmount = val;
            }
          }
        }
      }
    }
  }

  if (primaryAmount) return primaryAmount;
  if (secondaryAmount) return secondaryAmount;

  // Резервен вариант: най-голямата валидна парична сума в документа
  const allMatches = text.match(/\b\d+[.,]\d{2}\b/g);
  if (allMatches) {
    let max = 0;
    for (const m of allMatches) {
      const val = parseFloat(m.replace(",", "."));
      // Изключваме нереалистично големи числа (напр. ЕИК или часове)
      if (!isNaN(val) && val > max && val < 50000) {
        max = val;
      }
    }
    if (max > 0) return max;
  }

  return undefined;
}

/**
 * Автоматично класифицира вида на разхода на база съдържанието
 */
export function detectExpenseType(
  text: string
): "fuel" | "toll" | "accommodation" | "entry_fee" | "other" {
  if (!text) return "other";
  const upper = text.toUpperCase();

  // Гориво
  if (
    /БЕНЗИН|ДИЗЕЛ|DIESEL|GASOLINE|А-95|А95|А-98|LPG|ГАЗ|ГОРИВО|ЛИТРИ|ЛВ\/Л|ЛУКОЙЛ|SHELL|ОМВ|OMV|ПЕТРОЛ|ЕКО\b|ИНСА ОЙЛ/iu.test(
      upper
    )
  ) {
    return "fuel";
  }

  // Нощувка / Хотел
  if (
    /ХОТЕЛ|HOTEL|НОЩУВК|СТАЯ|НАСТАНЯВАН|ЛЕГЛО|КУРОРТНА ТАКСА|РЕЛАКС|КОМПЛЕКС/iu.test(
      upper
    )
  ) {
    return "accommodation";
  }

  // Пътни такси / Тол
  if (/ВИНЕТКА|ТОЛ|BGTOLL|БГТОЛ|ПЪТНА ТАКСА|МОСТ|ВИАДУКТ/iu.test(upper)) {
    return "toll";
  }

  // Такса участие
  if (
    /ТАКСА УЧАСТИЕ|ВХОДНА ТАКСА|ТУРНИР|СЪСТЕЗАНИЕ|БФ БАДМИНТОН/iu.test(upper)
  ) {
    return "entry_fee";
  }

  return "other";
}

/**
 * Главен анализатор на текст от документ (OCR или текстов PDF).
 */
export function parseExpenseText(text: string): ParsedExpenseData {
  const amountBGN = detectAmount(text);
  const amountEUR = amountBGN ? convertBgnToEur(amountBGN) : undefined;
  const supplierName = detectSupplierName(text);
  const documentNumber = detectDocumentNumber(text);
  const documentDate = normalizeDate(text);
  const expenseType = detectExpenseType(text);

  return {
    amountBGN,
    amountEUR,
    supplierName,
    documentNumber,
    documentDate,
    expenseType,
    rawText: text,
    source: "ocr",
  };
}

/**
 * Извлича текстов слой от PDF файл чрез четене на потоците данни
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawString = decoder.decode(bytes);

    // Търсене на текст в PDF обекти: (текст) Tj или [(текст)] TJ
    const textChunks: string[] = [];
    const tjMatches = rawString.match(/\(([^()]*)\)\s*Tj/g);
    if (tjMatches) {
      for (const m of tjMatches) {
        const inner = m.match(/\(([^()]*)\)/);
        if (inner && inner[1]) textChunks.push(inner[1]);
      }
    }

    // Търсене на текст в квадратни скоби: [ (текст1) 12 (текст2) ] TJ
    const arrayMatches = rawString.match(/\[([^\]]*)\]\s*TJ/g);
    if (arrayMatches) {
      for (const m of arrayMatches) {
        const inParens = m.match(/\(([^()]*)\)/g);
        if (inParens) {
          for (const p of inParens) {
            const cleanP = p.replace(/[()]/g, "");
            if (cleanP) textChunks.push(cleanP);
          }
        }
      }
    }

    if (textChunks.length > 5) {
      return textChunks.join(" ");
    }

    return rawString;
  } catch (err) {
    console.warn("PDF extract text error:", err);
    return "";
  }
}

/**
 * Цялостен процес за анализ на документ (снимка или PDF).
 * Извлича автоматично графите за разход: Доставчик, Номер, Дата, Сума, Вид разход.
 */
export async function processExpenseDocument(
  file: File,
  preParsedData?: ParsedExpenseData | null,
  onProgress?: (progress: number, status: string) => void
): Promise<ParsedExpenseData> {
  let combined: ParsedExpenseData = preParsedData || { source: "ocr" };

  // 1. Анализ на PDF
  if (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    onProgress?.(30, "Четене на PDF документ...");
    const pdfText = await extractTextFromPdf(file);
    const parsed = parseExpenseText(pdfText);

    combined = {
      ...parsed,
      ...combined,
      amountBGN: combined.amountBGN || parsed.amountBGN,
      amountEUR: combined.amountEUR || parsed.amountEUR,
      supplierName: combined.supplierName || parsed.supplierName,
      documentNumber: combined.documentNumber || parsed.documentNumber,
      documentDate: combined.documentDate || parsed.documentDate,
      expenseType: combined.expenseType || parsed.expenseType,
      source: "pdf",
    };
    onProgress?.(100, "Готово!");
    return combined;
  }

  // 2. Анализ на изображение
  if (file.type.startsWith("image/")) {
    onProgress?.(15, "Сканиране за НАП QR код...");

    // Опит за детекция на QR код от картинката, ако няма предварително подадени данни
    if (
      !combined.amountBGN &&
      typeof window !== "undefined" &&
      "BarcodeDetector" in window
    ) {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });
        const barcodes = await detector.detect(img);
        URL.revokeObjectURL(url);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          const qrData = parseNraQrCode(barcodes[0].rawValue);
          if (qrData) {
            combined = { ...combined, ...qrData };
          }
        }
      } catch {
        // Игнорираме евентуална грешка при QR детекцията
      }
    }

    onProgress?.(35, "Оптично разпознаване на текст (OCR)...");
    const { default: Tesseract } = await import("tesseract.js");
    const result = await Tesseract.recognize(file, "bul+eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && typeof m.progress === "number") {
          onProgress?.(
            Math.round(35 + m.progress * 60),
            "Разпознаване на текст..."
          );
        }
      },
    });

    const ocrText = result.data.text;
    const parsedOcr = parseExpenseText(ocrText);

    combined = {
      amountBGN: combined.amountBGN || parsedOcr.amountBGN,
      amountEUR: combined.amountEUR || parsedOcr.amountEUR,
      supplierName: combined.supplierName || parsedOcr.supplierName,
      documentNumber: combined.documentNumber || parsedOcr.documentNumber,
      documentDate: combined.documentDate || parsedOcr.documentDate,
      expenseType: combined.expenseType || parsedOcr.expenseType,
      rawText: ocrText,
      source: combined.source || "ocr",
    };

    onProgress?.(100, "Готово!");
    return combined;
  }

  return combined;
}
