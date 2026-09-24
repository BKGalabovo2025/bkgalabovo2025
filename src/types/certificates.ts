import { z } from "zod";

// ============================================================================
// 1. SPONSORS & PARTNERS SCHEMAS & TYPES
// ============================================================================

export const SponsorCategoryEnum = z.enum([
  "institutional", // Общини, Министерства, БФБ
  "gold", // Генерални / Златни спонсори
  "silver", // Сребърни спонсори
  "bronze", // Бронзови спонсори
  "partner", // Търговски & логистични партньори
  "general", // Общи дарители
]);
export type SponsorCategory = z.infer<typeof SponsorCategoryEnum>;

export const SponsorPartnerSchema = z.object({
  id: z.string().min(1, "ID е задължително"),
  siteId: z.enum(["bkgalabovo", "recoveryzone"]),
  name: z.string().min(2, "Името на партньора е задължително"),
  category: SponsorCategoryEnum.default("general"),
  logoUrl: z.string().min(1, "Логото е задължително"),
  websiteUrl: z
    .string()
    .url("Невалиден уеб адрес")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type SponsorPartner = z.infer<typeof SponsorPartnerSchema>;

export type SponsorPartnerCreateInput = Omit<
  SponsorPartner,
  "id" | "siteId" | "createdAt" | "updatedAt"
>;
export type SponsorPartnerUpdateInput = Partial<SponsorPartnerCreateInput>;

export const DEFAULT_INITIAL_SPONSORS: Array<
  Omit<SponsorPartner, "id" | "createdAt" | "updatedAt">
> = [
  {
    siteId: "bkgalabovo",
    name: "Община Гълъбово",
    category: "institutional",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e0/Coat_of_arms_of_Galabovo.png",
    websiteUrl: "https://galabovo.bg",
    description:
      "Генерален институционален партньор и подкрепа за младежкия спорт",
    isActive: true,
    order: 1,
  },
  {
    siteId: "bkgalabovo",
    name: "Българска Федерация Бадминтон (БФБ)",
    category: "institutional",
    logoUrl:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300&auto=format&fit=crop&q=80",
    websiteUrl: "https://badminton.bg",
    description: "Официална национална федерация по бадминтон",
    isActive: true,
    order: 2,
  },
  {
    siteId: "bkgalabovo",
    name: "Мини Марица-изток ЕАД",
    category: "gold",
    logoUrl:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80",
    websiteUrl: "https://marica-iztok.com",
    description: "Дългогодишен спонсор на детско-юношеския спортен клуб",
    isActive: true,
    order: 3,
  },
  {
    siteId: "bkgalabovo",
    name: "Спортен Комплекс „Енергетик“",
    category: "partner",
    logoUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&auto=format&fit=crop&q=80",
    websiteUrl: "https://galabovo.bg",
    description: "Логистична база и спортна зала за състезания и лагери",
    isActive: true,
    order: 4,
  },
  {
    siteId: "recoveryzone",
    name: "Recovery Zone by ZM",
    category: "institutional",
    logoUrl: "/recovery-zone/rz-icon-square.png",
    websiteUrl: "https://recoveryzone.bg",
    description:
      "Специализиран център за спортно възстановяване и рехабилитация",
    isActive: true,
    order: 1,
  },
];

// ============================================================================
// 2. TEMPLATES & VISUAL BUILDER SCHEMAS & TYPES
// ============================================================================

export const CertificateTypeEnum = z.enum(["award", "voucher", "certificate"]);
export type CertificateType = z.infer<typeof CertificateTypeEnum>;

export const TemplateStatusEnum = z.enum(["draft", "approved"]);
export type TemplateStatus = z.infer<typeof TemplateStatusEnum>;

export const FrameStyleEnum = z.enum([
  "classic_gold", // Класически златен орнамент
  "modern_minimal", // Изчистена минималистична рамка
  "sport_champion", // Динамична спортна рамка
  "luxury_dark", // Тъмен луксозен стил със златни кантове
  "sport_bold", // Спортен стил (съвместимост)
  "clean_border", // Елегантна тънка рамка
  "voucher_ticket", // Формат билет / ваучер с перфорация
]);
export type FrameStyle = z.infer<typeof FrameStyleEnum>;

export const OrientationEnum = z.enum(["landscape", "portrait"]);
export type Orientation = z.infer<typeof OrientationEnum>;

export const LayoutModeEnum = z.enum(["standard_html", "custom_ai_background"]);
export type LayoutMode = z.infer<typeof LayoutModeEnum>;

export const TextColorModeEnum = z.enum(["dark", "light", "auto"]);
export type TextColorMode = z.infer<typeof TextColorModeEnum>;

export const LayoutTemplateEnum = z.enum([
  "sports_voucher", // Спортен Ваучер/Флаер (+ [X] БЕЗПЛАТНИ ТРЕНИРОВКИ, заоблени карета, детски спортен арт)
  "official_award", // Официална Грамота (институция, училище, директор, лавров венец)
  "recovery_voucher", // Луксозен Ваучер Recovery Zone (тъмен/изумруден/златен изглед)
  "classic_certificate", // Официален Сертификат (сертификация, постигнати спортни нива)
]);
export type LayoutTemplate = z.infer<typeof LayoutTemplateEnum>;

export const VisualConfigSchema = z.object({
  orientation: OrientationEnum.default("landscape"),
  themeColor: z.string().default("#1E3A8A"), // Основен цвят
  secondaryColor: z.string().default("#D97706"), // Акцентен цвят (злато/кехлибар)
  backgroundColor: z.string().default("#FFFFFF"),
  backgroundImageUrl: z.string().optional(),
  frameStyle: FrameStyleEnum.default("classic_gold"),
  selectedSponsorIds: z.array(z.string()).default([]),
  signatoryName: z.string().default("Димитър Иванов"),
  signatoryTitle: z.string().default("Председател на БК Гълъбово"),
  coSignatoryName: z.string().optional(),
  coSignatoryTitle: z.string().optional(),
  showBadge: z.boolean().default(true),
  badgeText: z.string().optional(),
  customNotes: z.string().optional(),

  // Premium Canva-style Layout Template
  layoutTemplate: LayoutTemplateEnum.optional().default("official_award"),
  extraFreeSessions: z.number().int().optional(),
  contactPhone: z.string().optional(),

  // AI Background & Overlay Enhancements
  layoutMode: LayoutModeEnum.optional(),
  aiBackgroundUrl: z.string().optional(),
  overlayOpacity: z.number().min(0).max(100).optional(),
  textColorMode: TextColorModeEnum.optional(),
  contentAlignment: z.enum(["center", "left"]).optional(),

  // Adaptive & Prompt Engine Customizations
  customTextColor: z.string().optional(),
  customAccentColor: z.string().optional(),
  showQrCode: z.boolean().optional(),
  showSeal: z.boolean().optional(),
  showSponsors: z.boolean().optional(),
  showSignatures: z.boolean().optional(),
  targetAudience: z.enum(["kids", "adults_pro", "wellness"]).optional(),
  promptBulgarian: z.string().optional(),
  promptEnglish: z.string().optional(),
  eventName: z.string().optional(),
  eventLocation: z.string().optional(),
  customSealUrl: z.string().optional(),
  customQrUrl: z.string().optional(),
  watermarkOpacity: z.number().min(0).max(100).optional(),
  sealStyle: z
    .enum(["laurel", "rackets_crest", "monogram", "custom_upload"])
    .optional(),

  // Backside (Гръб на грамотата/сертификата)
  includeBackside: z.boolean().optional(),
  backsideStyle: z.enum(["coach_message", "tournament_protocol"]).optional(),
  backsideTitle: z.string().optional(),
  backsideMessage: z.string().optional(),
  backsideSignatory: z.string().optional(),

  // AI Style Switcher (Абстрактен лукс vs Спортна илюстрация)
  aiStyleMode: z.enum(["abstract_luxury", "sport_illustration"]).optional(),

  // Специфични полета за Ваучер
  voucherServiceType: z.string().optional(),
  voucherValue: z.string().optional(),
  voucherPromoCode: z.string().optional(),
  voucherExpiryDate: z.string().optional(),
});
export type VisualConfig = z.infer<typeof VisualConfigSchema>;

export const CertificateTemplateSchema = z.object({
  id: z.string().min(1),
  siteId: z.enum(["bkgalabovo", "recoveryzone"]),
  type: CertificateTypeEnum,
  title: z.string().min(3, "Заглавието на шаблона е задължително"),
  description: z.string().optional(),
  status: TemplateStatusEnum.default("draft"),
  visualConfig: VisualConfigSchema,
  defaultValidityDays: z.number().int().positive().optional(),
  defaultTotalSessions: z.number().int().positive().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type CertificateTemplate = z.infer<typeof CertificateTemplateSchema>;

export type CertificateTemplateCreateInput = Omit<
  CertificateTemplate,
  "id" | "siteId" | "createdAt" | "updatedAt"
>;
export type CertificateTemplateUpdateInput =
  Partial<CertificateTemplateCreateInput>;

export const DEFAULT_CERTIFICATE_TEMPLATES: Array<
  Omit<CertificateTemplate, "id" | "createdAt" | "updatedAt">
> = [
  {
    siteId: "bkgalabovo",
    type: "award",
    title: "Официална Грамота за Класиране",
    description:
      "Златен класически формат за вътрешни и национални турнири по бадминтон",
    status: "approved",
    visualConfig: {
      orientation: "landscape",
      themeColor: "#1E3A8A",
      secondaryColor: "#D97706",
      backgroundColor: "#FFFFFF",
      frameStyle: "classic_gold",
      layoutTemplate: "official_award",
      selectedSponsorIds: [],
      signatoryName: "Димитър Иванов",
      signatoryTitle: "Председател на БК Гълъбово",
      showBadge: true,
      badgeText: "ОФИЦИАЛНО ОТЛИЧИЕ",
      customNotes:
        "За отлично спортно представяне, дисциплина и висок боен дух на корта.",
    },
  },
  {
    siteId: "bkgalabovo",
    type: "award",
    title: "Грамота „Спортен Дух & Шампион“",
    description:
      "Динамичен дизайн със спортни елементи за детско-юношески състезания",
    status: "approved",
    visualConfig: {
      orientation: "landscape",
      themeColor: "#0F172A",
      secondaryColor: "#3B82F6",
      backgroundColor: "#FFFFFF",
      frameStyle: "sport_champion",
      layoutTemplate: "official_award",
      selectedSponsorIds: [],
      signatoryName: "Екип Треньори",
      signatoryTitle: "Главен треньор",
      showBadge: true,
      badgeText: "ШАМПИОН",
      customNotes:
        "За проявен характер, отдаденост в тренировъчния процес и спортсменство.",
    },
  },
  {
    siteId: "bkgalabovo",
    type: "certificate",
    title: "Клубен Сертификат за Участие в Лагер",
    description:
      "Сертификат за премината интензивна тренировъчна подготовка и лагери",
    status: "approved",
    visualConfig: {
      orientation: "landscape",
      themeColor: "#1E293B",
      secondaryColor: "#10B981",
      backgroundColor: "#FFFFFF",
      frameStyle: "modern_minimal",
      layoutTemplate: "classic_certificate",
      selectedSponsorIds: [],
      signatoryName: "Димитър Иванов",
      signatoryTitle: "Председател на БК Гълъбово",
      showBadge: true,
      badgeText: "СЕРТИФИКАТ",
      customNotes:
        "Успешно завършен подготвителен тренировъчен курс по бадминтон.",
    },
  },
  {
    siteId: "bkgalabovo",
    type: "voucher",
    title: "Подаръчен Ваучер за Тренировки (1 Месец)",
    description:
      "Персонален ваучер за тренировки и екипировка в залата на БК Гълъбово",
    status: "approved",
    defaultValidityDays: 180,
    defaultTotalSessions: 8,
    visualConfig: {
      orientation: "landscape",
      themeColor: "#1E3A8A",
      secondaryColor: "#F59E0B",
      backgroundColor: "#FFFFFF",
      frameStyle: "voucher_ticket",
      layoutTemplate: "sports_voucher",
      selectedSponsorIds: [],
      signatoryName: "БК Гълъбово",
      signatoryTitle: "Клубна администрация",
      showBadge: true,
      badgeText: "ПОДАРЪЧЕН ВАУЧЕР",
      customNotes:
        "Ваучерът важи за тренировки или наем на корт в рамките на срока на валидност.",
    },
  },
  {
    siteId: "recoveryzone",
    type: "voucher",
    title: "Луксозен Ваучер: Пакет Възстановяване (5 Сесии)",
    description:
      "Тъмен златен премиум дизайн за компресионни ботуши Normatec, инфрачервена сауна и масаж",
    status: "approved",
    defaultValidityDays: 90,
    defaultTotalSessions: 5,
    visualConfig: {
      orientation: "landscape",
      themeColor: "#09090B",
      secondaryColor: "#EAB308",
      backgroundColor: "#18181B",
      frameStyle: "luxury_dark",
      layoutTemplate: "recovery_voucher",
      selectedSponsorIds: [],
      signatoryName: "Здравко Мутафчиев",
      signatoryTitle: "Recovery Zone by ZM",
      showBadge: true,
      badgeText: "PREMIUM RECOVERY",
      customNotes:
        "Валиден за избрани процедури за дълбоко мускулно възстановяване и релаксация.",
    },
  },
  {
    siteId: "recoveryzone",
    type: "voucher",
    title: "Подаръчен Ваучер за Релакс & Възстановяване",
    description:
      "Модерен минималистичен ваучер с гъвкава парична стойност или брой сесии",
    status: "approved",
    defaultValidityDays: 120,
    defaultTotalSessions: 1,
    visualConfig: {
      orientation: "landscape",
      themeColor: "#0F766E",
      secondaryColor: "#14B8A6",
      backgroundColor: "#FFFFFF",
      frameStyle: "modern_minimal",
      layoutTemplate: "recovery_voucher",
      selectedSponsorIds: [],
      signatoryName: "Recovery Zone",
      signatoryTitle: "Рецепция & Специалисти",
      showBadge: true,
      badgeText: "GIFT VOUCHER",
      customNotes:
        "Подарете здраве, тонус и бързо възстановяване след физическо натоварване.",
    },
  },
];

// ============================================================================
// 3. ISSUED CERTIFICATES & VOUCHERS SCHEMAS & TYPES
// ============================================================================

export const VoucherStatusEnum = z.enum(["active", "expired", "fully_used"]);
export type VoucherStatus = z.infer<typeof VoucherStatusEnum>;

export const AwardRankEnum = z.enum([
  "1st",
  "2nd",
  "3rd",
  "participant",
  "honorable",
]);
export type AwardRank = z.infer<typeof AwardRankEnum>;

export const VoucherUsageLogItemSchema = z.object({
  date: z.string(),
  markedByEmail: z.string(),
  markedByName: z.string().optional(),
  sessionNumber: z.number(),
  note: z.string().optional(),
});
export type VoucherUsageLogItem = z.infer<typeof VoucherUsageLogItemSchema>;

export const IssuedCertificateSchema = z.object({
  id: z.string().min(1),
  siteId: z.enum(["bkgalabovo", "recoveryzone"]),
  templateId: z.string(),
  type: CertificateTypeEnum,
  serialNumber: z.string(), // напр. BKG-2026-ABCD

  // Получател
  recipient: z.object({
    memberId: z.string().optional(),
    name: z.string().min(2, "Името на получателя е задължително"),
    institution: z.string().optional(), // Училище, детска градина
    avatarUrl: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),

  // Специфични детайли според типа
  details: z.object({
    // За Грамоти (award)
    rank: AwardRankEnum.optional(),
    nomination: z.string().optional(), // "Най-перспективен млад състезател", "Спортен дух"
    category: z.string().optional(), // "Момчета под 11г."
    eventTitle: z.string().optional(), // "Коледен турнир Гълъбово 2026"
    eventDate: z.string().optional(),
    eventLocation: z.string().optional(),

    // За Ваучери (voucher)
    voucherServiceType: z.string().optional(),
    voucherValue: z.string().optional(),
    voucherPromoCode: z.string().optional(),
    voucherExpiryDate: z.string().optional(),
    totalSessions: z.number().int().optional(),
    usedSessions: z.number().int().default(0),
    remainingSessions: z.number().int().optional(),
    validUntil: z.string().optional(),
    voucherStatus: VoucherStatusEnum.optional(),
    usageLog: z.array(VoucherUsageLogItemSchema).default([]),

    // За Сертификати (certificate)
    skillsSummary: z.string().optional(),
    courseTitle: z.string().optional(),
    completionDate: z.string().optional(),
    hoursTrained: z.number().optional(),

    // За Двустранен документ (backside)
    includeBackside: z.boolean().optional(),
    backsideStyle: z.enum(["coach_message", "tournament_protocol"]).optional(),
    backsideTitle: z.string().optional(),
    backsideMessage: z.string().optional(),
    backsideSignatory: z.string().optional(),
  }),

  // Замразен визуален снапшот към момента на издаване
  visualSnapshot: VisualConfigSchema.extend({
    templateTitle: z.string(),
    sponsors: z
      .array(
        z.object({
          name: z.string(),
          logoUrl: z.string(),
          websiteUrl: z.string().optional(),
        })
      )
      .default([]),
  }),

  qrCodeDataUrl: z.string().optional(),
  issuedAt: z.string(),
  issuedByEmail: z.string(),
  issuedByName: z.string().optional(),
});
export type IssuedCertificate = z.infer<typeof IssuedCertificateSchema>;

export type IssueCertificateInput = {
  templateId: string;
  type: CertificateType;
  recipient: {
    memberId?: string;
    name: string;
    institution?: string;
    email?: string;
    phone?: string;
  };
  details: {
    rank?: AwardRank;
    nomination?: string;
    category?: string;
    eventTitle?: string;
    eventDate?: string;
    eventLocation?: string;
    voucherServiceType?: string;
    voucherValue?: string;
    voucherPromoCode?: string;
    voucherExpiryDate?: string;
    totalSessions?: number;
    validityDays?: number;
    validUntil?: string;
    skillsSummary?: string;
    courseTitle?: string;
    completionDate?: string;
    hoursTrained?: number;
    includeBackside?: boolean;
    backsideStyle?: "coach_message" | "tournament_protocol";
    backsideTitle?: string;
    backsideMessage?: string;
    backsideSignatory?: string;
  };
};

// ============================================================================
// 4. HELPER UTILITIES
// ============================================================================

/**
 * Генерира уникален четим сериен номер за документ:
 * Формат: BKG-2026-XXXX или RZ-2026-XXXX
 */
export function generateCertificateSerialNumber(
  siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
): string {
  const currentYear = new Date().getFullYear();
  const prefix = siteId === "recoveryzone" ? "RZ" : "BKG";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomCode += chars[randomIndex];
  }
  return `${prefix}-${currentYear}-${randomCode}`;
}

export function getRankLabel(rank?: AwardRank): string {
  switch (rank) {
    case "1st":
      return "🥇 I-во Място";
    case "2nd":
      return "🥈 II-ро Място";
    case "3rd":
      return "🥉 III-то Място";
    case "participant":
      return "🎗️ Грамота за Участие";
    case "honorable":
      return "⭐ Почетна Грамота";
    default:
      return "Грамота за Отличие";
  }
}

export function getSponsorCategoryLabel(category: SponsorCategory): string {
  switch (category) {
    case "institutional":
      return "🏛️ Институционален партньор";
    case "gold":
      return "🥇 Генерален / Златен спонсор";
    case "silver":
      return "🥈 Сребърен спонсор";
    case "bronze":
      return "🥉 Бронзов спонсор";
    case "partner":
      return "🤝 Партньор";
    default:
      return "🌟 Спонсор";
  }
}

export function getFrameStyleLabel(style: FrameStyle): string {
  switch (style) {
    case "classic_gold":
      return "🏆 Класически златен орнамент";
    case "modern_minimal":
      return "✨ Модерен минималистичен";
    case "sport_champion":
      return "🏸 Спортен шампион (динамичен)";
    case "luxury_dark":
      return "💎 Луксозен тъмен със злато";
    case "sport_bold":
      return "⚡ Спортен стил";
    case "clean_border":
      return "📐 Елегантна изчистена рамка";
    case "voucher_ticket":
      return "🎟️ Ваучер билет с перфорация";
    default:
      return "Класически";
  }
}

export function getCertificateTypeLabel(type: CertificateType): string {
  switch (type) {
    case "award":
      return "🏆 Грамота";
    case "voucher":
      return "🎟️ Подаръчен Ваучер";
    case "certificate":
      return "📜 Сертификат";
    default:
      return "Документ";
  }
}
