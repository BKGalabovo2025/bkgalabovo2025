import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  MarketingAutomationRule,
  MarketingChannel,
  MarketingLog,
  MarketingLogFormData,
  MarketingRecipient,
  MarketingStats,
  MarketingTemplate,
  MarketingTemplateCategory,
} from "@/types/marketing.types";

const HISTORY_COLLECTION = "marketing_history";
const TEMPLATES_COLLECTION = "marketing_templates";
const AUTOMATIONS_COLLECTION = "marketing_automations";

type TemplateCreateInput = Omit<
  MarketingTemplate,
  "id" | "siteId" | "createdAt"
>;

type TemplateUpdateInput = Partial<TemplateCreateInput>;

export const DEFAULT_MARKETING_TEMPLATES: TemplateCreateInput[] = [
  {
    title: "🏕️ Покана за клубен лагер",
    category: "camp",
    channel: "email",
    subject: "Покана за предстоящ тренировъчен лагер - БК Гълъбово",
    messageText:
      "Здравейте, {ИМЕ}!\n\nИмаме удоволствието да Ви поканим на предстоящия клубен лагер {СЪБИТИЕ} от {ДАТА}.\nОчакват ни интензивни тренировки, много емоции и нови спортни умения за {ДЕТЕ}.\n\nПовече информация и записване: {ЛИНК}\n\nОчакваме Ви!\nЕкипът на БК Гълъбово 🏸",
    variables: ["{ИМЕ}", "{ДЕТЕ}", "{СЪБИТИЕ}", "{ДАТА}", "{ЛИНК}"],
    isDefault: true,
  },
  {
    title: "🏸 Покана за вътрешен / регионален турнир",
    category: "tournament",
    channel: "email",
    subject: "Регистрация за състезателен турнир",
    messageText:
      "Здравейте, {ИМЕ}!\n\nЗапочна записването за турнира {СЪБИТИЕ} на {ДАТА} в {ЛОКАЦИЯ}.\n{ДЕТЕ} може да се включи в състезанието и да покаже наученото на корта!\n\nВижте детайли и график: {ЛИНК}\n\nУспех на състезателите! 🌟",
    variables: [
      "{ИМЕ}",
      "{ДЕТЕ}",
      "{СЪБИТИЕ}",
      "{ДАТА}",
      "{ЛОКАЦИЯ}",
      "{ЛИНК}",
    ],
    isDefault: true,
  },
  {
    title: "💳 Напомняне за месечна такса / абонамент",
    category: "payment",
    channel: "email",
    subject: "Напомняне за подновяване на месечен абонамент",
    messageText:
      "Здравейте, {ИМЕ}!\n\nНапомняме Ви за подновяване на месечния абонамент за тренировки на {ДЕТЕ} за текущия месец. Можете да заплатите на рецепция в залата или по банков път.\n\nБлагодарим за доверието!\nБК Гълъбово",
    variables: ["{ИМЕ}", "{ДЕТЕ}"],
    isDefault: true,
  },
  {
    title: "⏰ Промяна в график или зала",
    category: "schedule",
    channel: "email",
    subject: "Важно съобщение за промяна в графика на тренировките",
    messageText:
      "Здравейте, {ИМЕ}!\n\nУведомяваме Ви за промяна в тренировката на {ДАТА}:\nНов час: {ЧАС}\nЗала/Локация: {ЛОКАЦИЯ}\n\nМоля да потвърдите присъствието на {ДЕТЕ}.\nСпортни поздрави, БК Гълъбово",
    variables: ["{ИМЕ}", "{ДЕТЕ}", "{ДАТА}", "{ЧАС}", "{ЛОКАЦИЯ}"],
    isDefault: true,
  },
  {
    title: "🌟 Линк към клубна анкета за обратна връзка",
    category: "feedback",
    channel: "email",
    subject: "Вашето мнение е важно за нас! - БК Гълъбово",
    messageText:
      "Здравейте, {ИМЕ}!\n\nВашето мнение за тренировките и събитията на {ДЕТЕ} е изключително ценно за развитието на клуба ни.\n\nМоля, споделете впечатленията си само за 1-2 минути през нашата клубна анкета:\n{ЛИНК_АНКЕТА}\n\nБлагодарим Ви, че ни помагате да ставаме по-добри! 🏸❤️",
    variables: ["{ИМЕ}", "{ДЕТЕ}", "{ЛИНК_АНКЕТА}"],
    isDefault: true,
  },
  {
    title: "🗓️ Потвърждение за запазен час / резервация",
    category: "general",
    channel: "email",
    subject: "Потвърждение за запазен час - БК Гълъбово",
    messageText:
      "Здравейте, {ИМЕ}!\n\nУспешно запазихте час на {ДАТА} от {ЧАС} за {ЛОКАЦИЯ}.\n\nОчакваме Ви в залата!\nТелефон за връзка при въпроси: 0899 829 923",
    variables: ["{ИМЕ}", "{ДАТА}", "{ЧАС}", "{ЛОКАЦИЯ}"],
    isDefault: true,
  },
];

export const DEFAULT_RECOVERY_TEMPLATES: TemplateCreateInput[] = [
  {
    title: "🧖‍♂️ Потвърждение за час за възстановяване",
    category: "recovery",
    channel: "email",
    subject: "Потвърждение за запазен час - Recovery Zone by ZM",
    messageText:
      "Здравейте, {ИМЕ}!\n\nУспешно запазихте час за възстановителна процедура {СЪБИТИЕ} на {ДАТА} от {ЧАС} в {ЛОКАЦИЯ}.\n\nОчакваме Ви за релакс и пълноценно възстановяване!\nТелефон за връзка: 0899 829 923\nЕкипът на Recovery Zone by ZM",
    variables: ["{ИМЕ}", "{СЪБИТИЕ}", "{ДАТА}", "{ЧАС}", "{ЛОКАЦИЯ}"],
    isDefault: true,
  },
  {
    title: "💆‍♀️ Напомняне за час в Recovery Zone",
    category: "recovery",
    channel: "email",
    subject: "Напомняне за запазен час - Recovery Zone",
    messageText:
      "Здравейте, {ИМЕ}!\n\nНапомняме Ви за Вашия час за възстановяване на {ДАТА} от {ЧАС} в Recovery Zone by ZM.\n\nОчакваме Ви!",
    variables: ["{ИМЕ}", "{ДАТА}", "{ЧАС}"],
    isDefault: true,
  },
  {
    title: "💳 Подновяване на пакет за процедури",
    category: "payment",
    channel: "email",
    subject: "Подновяване на възстановителен пакет",
    messageText:
      "Здравейте, {ИМЕ}!\n\nВашият абонамент за възстановителни процедури в Recovery Zone by ZM е към своя край.\n\nМожете да презаредите пакета си на рецепция в залата.\nБлагодарим Ви за доверието!",
    variables: ["{ИМЕ}"],
    isDefault: true,
  },
  {
    title: "💬 Анкета за обратна връзка от възстановяването",
    category: "feedback",
    channel: "email",
    subject: "Вашето мнение за Recovery Zone by ZM",
    messageText:
      "Здравейте, {ИМЕ}!\n\nВашето мнение за процедурите и обслужването в Recovery Zone by ZM е изключително ценно за нас.\n\nМоля, споделете впечатленията си в кратката ни анкета: {ЛИНК_АНКЕТА}\n\nБлагодарим Ви!",
    variables: ["{ИМЕ}", "{ЛИНК_АНКЕТА}"],
    isDefault: true,
  },
  {
    title: "🌟 Специална оферта за нови процедури",
    category: "procedures",
    channel: "email",
    subject: "Специално предложение от Recovery Zone by ZM",
    messageText:
      "Здравейте, {ИМЕ}!\n\nИмаме удоволствието да Ви представим нашите най-нови възстановителни терапии и промоционални пакети.\n\nОчакваме Ви за релакс и възстановяване!\n\nПоздрави,\nRecovery Zone by ZM",
    variables: ["{ИМЕ}"],
    isDefault: true,
  },
  {
    title: "⏰ Промяна в график за процедура",
    category: "schedule",
    channel: "email",
    subject: "Промяна в час за процедура",
    messageText:
      "Здравейте, {ИМЕ}!\n\nУведомяваме Ви за промяна в графика на Вашия час за {ДАТА}. Нов час: {ЧАС} в {ЛОКАЦИЯ}.\n\nМоля да се свържете с нас при нужда от промяна. Recovery Zone by ZM",
    variables: ["{ИМЕ}", "{ДАТА}", "{ЧАС}", "{ЛОКАЦИЯ}"],
    isDefault: true,
  },
];

function getInMemoryTemplates(siteId: string): MarketingTemplate[] {
  const list =
    siteId === "recoveryzone"
      ? DEFAULT_RECOVERY_TEMPLATES
      : DEFAULT_MARKETING_TEMPLATES;
  return list.map((tmpl, idx) => ({
    ...tmpl,
    id: `${siteId}_default_${idx}`,
    siteId,
    createdAt: new Date().toISOString(),
  }));
}

async function seedDefaultTemplates(
  siteId: string,
  defaults: TemplateCreateInput[]
): Promise<MarketingTemplate[]> {
  const inMemory = getInMemoryTemplates(siteId);
  try {
    const seeded: MarketingTemplate[] = [];
    let index = 0;
    for (const tmpl of defaults) {
      const docId = `${siteId}_template_${index}`;
      const docRef = doc(db, TEMPLATES_COLLECTION, docId);
      await setDoc(docRef, {
        ...tmpl,
        siteId,
        createdAt: new Date().toISOString(),
      });
      seeded.push({
        ...tmpl,
        id: docId,
        siteId,
        createdAt: new Date().toISOString(),
      });
      index++;
    }
    return seeded;
  } catch {
    // If client lacks write permission to seed, gracefully return in-memory defaults
    return inMemory;
  }
}

function parseAndDeduplicateTemplates(
  docs: Array<{ id: string; data: () => Record<string, unknown> }>
): MarketingTemplate[] {
  const seenTitles = new Set<string>();
  const templates: MarketingTemplate[] = [];

  for (const docSnap of docs) {
    const data = docSnap.data();
    const title = String(data.title || "");
    if (seenTitles.has(title)) {
      continue;
    }
    seenTitles.add(title);
    templates.push({
      id: docSnap.id,
      siteId: String(data.siteId || ""),
      title,
      category: (data.category as MarketingTemplateCategory) || "general",
      channel: (data.channel as MarketingChannel) || "email",
      subject: String(data.subject || ""),
      messageText: String(data.messageText || ""),
      variables: Array.isArray(data.variables)
        ? (data.variables as string[])
        : [],
      isDefault: Boolean(data.isDefault),
      createdAt: String(data.createdAt || new Date().toISOString()),
      updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    });
  }

  return templates;
}

function mergeTemplatesWithDefaults(
  firestoreTemplates: MarketingTemplate[],
  siteId: string
): MarketingTemplate[] {
  const merged: MarketingTemplate[] = [];
  const seenTitles = new Set<string>();

  for (const t of firestoreTemplates) {
    const key = t.title.trim().toLowerCase();
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      merged.push({
        ...t,
        siteId: t.siteId || siteId,
      });
    }
  }

  const defaults = getInMemoryTemplates(siteId);
  for (const def of defaults) {
    const key = def.title.trim().toLowerCase();
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      merged.push(def);
    }
  }

  return merged;
}

export const marketingService = {
  // -------------------------------------------------------------
  // TEMPLATES
  // -------------------------------------------------------------
  async getTemplates(siteId: string): Promise<MarketingTemplate[]> {
    try {
      if (siteId === "recoveryzone") {
        const q = query(
          collection(db, TEMPLATES_COLLECTION),
          where("siteId", "==", "recoveryzone")
        );
        const snapshot = await getDocs(q);

        const hasBadmintonContent = snapshot.docs.some((d) => {
          const text = (d.data().messageText || "") + (d.data().title || "");
          return (
            text.includes("БК Гълъбово") ||
            text.includes("лагер") ||
            text.includes("турнир")
          );
        });

        if (snapshot.empty || hasBadmintonContent) {
          try {
            for (const docSnap of snapshot.docs) {
              await deleteDoc(docSnap.ref).catch(() => {});
            }
            await seedDefaultTemplates(
              "recoveryzone",
              DEFAULT_RECOVERY_TEMPLATES
            );
          } catch {
            // Silently fall back to in-memory templates
          }
          return getInMemoryTemplates("recoveryzone");
        }

        const parsed = parseAndDeduplicateTemplates(snapshot.docs);
        return mergeTemplatesWithDefaults(parsed, "recoveryzone");
      }

      // siteId === "bkgalabovo"
      const q = query(
        collection(db, TEMPLATES_COLLECTION),
        where("siteId", "==", "bkgalabovo")
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        try {
          await seedDefaultTemplates("bkgalabovo", DEFAULT_MARKETING_TEMPLATES);
        } catch {
          // Silently fall back to in-memory templates
        }
        return getInMemoryTemplates("bkgalabovo");
      }

      const parsed = parseAndDeduplicateTemplates(snapshot.docs);
      return mergeTemplatesWithDefaults(parsed, "bkgalabovo");
    } catch (error) {
      console.warn(
        "Could not query templates from Firestore, using defaults:",
        error
      );
      return getInMemoryTemplates(siteId);
    }
  },

  async getAllTemplates(): Promise<MarketingTemplate[]> {
    try {
      const [bkg, rz] = await Promise.all([
        this.getTemplates("bkgalabovo"),
        this.getTemplates("recoveryzone"),
      ]);
      return [...bkg, ...rz];
    } catch (error) {
      console.warn(
        "Could not query all templates, returning in-memory:",
        error
      );
      return [
        ...getInMemoryTemplates("bkgalabovo"),
        ...getInMemoryTemplates("recoveryzone"),
      ];
    }
  },

  async createTemplate(
    siteId: string,
    data: TemplateCreateInput
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
        ...data,
        siteId,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  },

  async updateTemplate(id: string, data: TemplateUpdateInput): Promise<void> {
    try {
      const ref = doc(db, TEMPLATES_COLLECTION, id);
      await setDoc(
        ref,
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating template:", error);
      throw error;
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    try {
      const ref = doc(db, TEMPLATES_COLLECTION, id);
      await deleteDoc(ref).catch(() => {});
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  },

  // -------------------------------------------------------------
  // HISTORY & LOGGING
  // -------------------------------------------------------------
  async logMessage(data: MarketingLogFormData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, HISTORY_COLLECTION), {
        ...data,
        sentAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error logging marketing message:", error);
      throw error;
    }
  },

  async logBatchMessages(messages: MarketingLogFormData[]): Promise<void> {
    if (messages.length === 0) return;
    try {
      const batch = writeBatch(db);
      for (const msg of messages) {
        const docRef = doc(collection(db, HISTORY_COLLECTION));
        batch.set(docRef, {
          ...msg,
          sentAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (error) {
      console.error("Error logging batch messages:", error);
      throw error;
    }
  },

  async getHistory(
    siteId: string,
    limitCount: number = 200
  ): Promise<MarketingLog[]> {
    try {
      const q = query(
        collection(db, HISTORY_COLLECTION),
        where("siteId", "==", siteId),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          siteId: data.siteId || siteId,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          recipientEmail: data.recipientEmail,
          channel: (data.channel as MarketingChannel) || "phone",
          messageText: data.messageText,
          templateUsed: data.templateUsed,
          campaignTitle: data.campaignTitle,
          status: data.status || "sent",
          sentAt:
            data.sentAt?.toDate?.()?.toISOString() ||
            (typeof data.sentAt === "string"
              ? data.sentAt
              : new Date().toISOString()),
          sentBy: data.sentBy,
        } as MarketingLog;
      });

      return logs.sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      );
    } catch (error) {
      console.warn("Notice: could not query marketing history:", error);
      return [];
    }
  },

  async deleteMarketingLog(id: string): Promise<void> {
    try {
      const ref = doc(db, HISTORY_COLLECTION, id);
      await deleteDoc(ref);
    } catch (error) {
      console.error("Error deleting marketing log:", error);
      throw error;
    }
  },

  async clearMarketingHistory(siteId: string): Promise<void> {
    try {
      const q = query(
        collection(db, HISTORY_COLLECTION),
        where("siteId", "==", siteId)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error clearing marketing history:", error);
      throw error;
    }
  },

  // -------------------------------------------------------------
  // STATS
  // -------------------------------------------------------------
  async getMarketingStats(siteId: string): Promise<MarketingStats> {
    try {
      const history = await this.getHistory(siteId, 500);
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const byChannel: Record<MarketingChannel, number> = {
        email: 0,
        phone: 0,
      };

      let sentThisMonth = 0;
      const uniqueRecipients = new Set<string>();

      for (const log of history) {
        if (log.channel && byChannel[log.channel] !== undefined) {
          byChannel[log.channel]++;
        }
        if (log.recipientId) {
          uniqueRecipients.add(log.recipientId);
        }
        const logDate = new Date(log.sentAt);
        if (
          logDate.getMonth() === currentMonth &&
          logDate.getFullYear() === currentYear
        ) {
          sentThisMonth++;
        }
      }

      return {
        totalSent: history.length,
        sentThisMonth,
        byChannel,
        activeRecipientsCount: uniqueRecipients.size,
        callsCount: byChannel.phone || 0,
        emailsCount: byChannel.email || 0,
      };
    } catch (error) {
      console.error("Error calculating marketing stats:", error);
      return {
        totalSent: 0,
        sentThisMonth: 0,
        byChannel: { phone: 0, email: 0 },
        activeRecipientsCount: 0,
        callsCount: 0,
        emailsCount: 0,
      };
    }
  },

  // -------------------------------------------------------------
  // AUTOMATIONS
  // -------------------------------------------------------------
  async getAutomationRules(siteId: string): Promise<MarketingAutomationRule[]> {
    const defaultRules: MarketingAutomationRule[] = [
      {
        id: `${siteId}_rule_1`,
        siteId,
        title: "Автоматична покана за анкета 24ч след лагер",
        description:
          "Изпраща линк към клубната анкета до всички участници 24 часа след приключване на тренировъчен лагер.",
        triggerEvent: "post_camp_survey",
        delayHours: 24,
        channel: "email",
        isActive: true,
      },
      {
        id: `${siteId}_rule_2`,
        siteId,
        title: "Покана за обратна връзка след състезателен турнир",
        description:
          "Изпраща благодарствено съобщение и линк за отзиви в рамките на 48 часа след финала на турнир.",
        triggerEvent: "post_tournament_survey",
        delayHours: 48,
        channel: "email",
        isActive: true,
      },
      {
        id: `${siteId}_rule_3`,
        siteId,
        title: "Напомняне 3 дни преди изтичане на месечна такса",
        description:
          "Автоматично напомняне за подновяване на членството към родителите.",
        triggerEvent: "membership_expiring",
        delayHours: 72,
        channel: "email",
        isActive: false,
      },
    ];

    try {
      const q = query(
        collection(db, AUTOMATIONS_COLLECTION),
        where("siteId", "==", siteId)
      );
      const snapshot = await getDocs(q);

      const seenKeys = new Set<string>();
      const seenIds = new Set<string>();
      const rules: MarketingAutomationRule[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const title = String(data.title || "").trim();
        const trigger = String(data.triggerEvent || "post_camp_survey");
        const docId = docSnap.id;

        const dedupeKey = trigger || title.toLowerCase();
        if (seenKeys.has(dedupeKey) || seenIds.has(docId)) {
          deleteDoc(docSnap.ref).catch(() => {});
          continue;
        }
        seenKeys.add(dedupeKey);
        seenIds.add(docId);

        const channel: MarketingChannel =
          data.channel === "phone" ? "phone" : "email";

        rules.push({
          id: docId,
          siteId: String(data.siteId || siteId),
          title,
          description: String(data.description || ""),
          triggerEvent:
            (data.triggerEvent as MarketingAutomationRule["triggerEvent"]) ||
            "post_camp_survey",
          delayHours: Number(data.delayHours || 24),
          channel,
          templateId: data.templateId ? String(data.templateId) : undefined,
          isActive: Boolean(data.isActive),
        });
      }

      for (const def of defaultRules) {
        const dedupeKey = def.triggerEvent || def.title.toLowerCase();
        if (!seenKeys.has(dedupeKey) && !seenIds.has(def.id)) {
          seenKeys.add(dedupeKey);
          seenIds.add(def.id);
          rules.push(def);
        }
      }

      return rules;
    } catch (error) {
      console.warn("Notice: Using default marketing automations:", error);
      return defaultRules;
    }
  },

  async toggleAutomationRule(
    id: string,
    isActive: boolean,
    siteId: string = "bkgalabovo"
  ): Promise<void> {
    try {
      const ref = doc(db, AUTOMATIONS_COLLECTION, id);
      await setDoc(
        ref,
        {
          isActive,
          siteId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn(
        "Notice: Could not toggle automation rule in Firestore:",
        error
      );
    }
  },

  async logPhoneCall(
    recipient: MarketingRecipient,
    outcome: string,
    notes?: string,
    sentBy?: string
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const messageContent = notes ? `${outcome} — ${notes}` : outcome;
      await addDoc(collection(db, HISTORY_COLLECTION), {
        siteId: recipient.siteId || "bkgalabovo",
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientPhone: recipient.phone || "",
        recipientEmail: recipient.email || "",
        channel: "phone",
        messageText: messageContent,
        templateUsed: "Телефонно обаждане",
        status: "sent",
        sentAt: now,
        sentBy: sentBy || "admin",
      });
    } catch (error) {
      console.error("Error logging phone call:", error);
      throw error;
    }
  },
};
