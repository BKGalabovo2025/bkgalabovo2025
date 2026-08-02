import { z } from "zod";

/**
 * Currency utilities (Bulgaria uses EUR in 2026)
 * Fixed exchange rate: 1 EUR = 1.95583 BGN
 */
const EUR_BGN_EXCHANGE_RATE = 1.95583;

export const convertEurToBgn = (eur: number): number => {
  return Number((eur * EUR_BGN_EXCHANGE_RATE).toFixed(2));
};

export const convertBgnToEur = (bgn: number): number => {
  return Number((bgn / EUR_BGN_EXCHANGE_RATE).toFixed(2));
};

// ---------------------------------------------------------
// Енумерации (Enums)
// ---------------------------------------------------------

/**
 * Вид на транспорта
 */
const TransportTypeEnum = z.enum([
  "club_paid", // Клубен/Нает транспорт (с фактура на името на клуба)
  "free", // Безплатен (напр. от организатор, спонсор, родител)
  "fuel_only", // Лично МПС, плаща се само гориво (по Пътен лист)
  "public", // Обществен транспорт (влак/автобус)
]);

/**
 * Вид на разхода (Фактура/Касов бон)
 */
const ExpenseTypeEnum = z.enum([
  "fuel", // Гориво
  "transport", // Транспорт (билети, такси)
  "accommodation", // Нощувки (Квартирни)
  "food", // Храна (допълнителна извън дневните)
  "entry_fee", // Входна такса за турнир
  "other", // Други (материали, екипировка)
]);

/**
 * Статус на командировката
 */
const BusinessTripStatusEnum = z.enum([
  "draft", // Чернова (в процес на създаване/одобрение)
  "approved", // Одобрена и активна
  "completed", // Приключена и отчетена към счетоводството
]);

// ---------------------------------------------------------
// Схеми (Schemas)
// ---------------------------------------------------------

/**
 * Информация за МПС (използва се за Пътен лист)
 */
const VehicleInfoSchema = z.object({
  brand: z.string().optional(),
  regNumber: z.string().optional(),
  fuelNorm: z.number().min(0).optional(), // Разходна норма (л/100 км)
  distanceKm: z.number().min(0).optional(), // Разстояние в км (ръчно въвеждане за сега, готово за API)
  fuelType: z.string().optional(), // Вид гориво (напр. бензин А-95, дизелово гориво, газ)
});

/**
 * Финансови параметри (Законови ставки за дневни и квартирни в EUR)
 */
const TripFinancialsSchema = z.object({
  perDiemRateEUR: z.number().min(0), // Стандартни дневни пари (по закон)
  perDiemOverrideEUR: z.number().min(0).optional(), // Ръчна корекция (хибриден подход) - ако клубът реши друга сума
  accommodationRateEUR: z.number().min(0), // Квартирни пари в Евро
  entryFeeEUR: z.number().min(0).optional(), // Входна такса за турнир
  isCommercialActivity: z.boolean(), // Стопанска (true) или Нестопанска (false) дейност
});

/**
 * Основен модел за Командировка / Пътуване
 */
export const BusinessTripSchema = z.object({
  id: z.string().optional(),
  siteId: z.string().min(1, "Site ID е задължително"),
  eventId: z.string().optional(), // Връзка с турнира/събитието от Графика (ако има такова)
  title: z.string().min(2, "Заглавието трябва да е поне 2 символа"),
  destination: z.string().min(2, "Дестинацията е задължителна"),
  startDate: z.string().datetime({ message: "Невалидна начална дата" }),
  endDate: z.string().datetime({ message: "Невалидна крайна дата" }),
  coachId: z
    .string()
    .min(1, "Изберете командировано лице (треньор/ръководител)"),
  organizer: z.string().optional(),
  hostClub: z.string().optional(),
  coachName: z.string().optional(),
  coachRole: z.string().optional(),
  participantsIds: z.array(z.string()).default([]), // Списък с IDs на избраните състезатели
  transportType: TransportTypeEnum,
  vehicle: VehicleInfoSchema.optional(),
  financials: TripFinancialsSchema,
  status: BusinessTripStatusEnum.default("draft"),
  /** Официална дата на Заповедта (може да се редактира ръчно в диалога) */
  orderDate: z.string().datetime().optional(),
  usDecision: z.string().optional(), // Решение на УС № ... от ...
  signatures: z
    .object({
      coach: z.string().optional(), // Base64 PNG image
      chairman: z.string().optional(), // Base64 PNG image
    })
    .optional(),
  orderDownloadedAt: z.string().datetime().optional(),
  statementDownloadedAt: z.string().datetime().optional(),
  fuelDownloadedAt: z.string().datetime().optional(),
  attendanceDownloadedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Модел за Разход / Фактура към командировка
 */
export const TripExpenseSchema = z.object({
  id: z.string().optional(),
  tripId: z.string().min(1, "ID на командировката е задължително"),
  siteId: z.string().min(1, "Site ID е задължително"),
  expenseType: ExpenseTypeEnum,
  amountEUR: z.number().min(0, "Сумата трябва да е положителна (в EUR)"),
  documentNumber: z.string().optional(), // № на фактура / касов бон
  documentDate: z.string().datetime().optional(),
  supplierName: z.string().optional(), // Име на доставчик (напр. бензиностанция, хотел)
  attachmentUrl: z.string().optional(), // URL към снимката/скана на документа
  createdAt: z.string().datetime().optional(),
});

// ---------------------------------------------------------
// TypeScript Типове (Types)
// ---------------------------------------------------------

export type BusinessTrip = z.infer<typeof BusinessTripSchema>;
export type TripExpense = z.infer<typeof TripExpenseSchema>;
