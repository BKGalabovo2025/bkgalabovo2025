import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  MarketingAutomationRule,
  MarketingLog,
  MarketingLogFormData,
  MarketingStats,
  MarketingTemplate,
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
    channel: "whatsapp",
    subject: "Покана за предстоящ тренировъчен лагер - БК Гълъбово",
    messageText:
      "Здравейте, {ИМЕ}!\n\nИмаме удоволствието да Ви поканим на предстоящия клубен лагер {СЪБИТИЕ} от {ДАТА}.\nОчакват ни интензивни тренировки, много емоции и нови спортни умения за {ДЕТЕ}.\n\nПовече информация и записване: {ЛИНК}\n\nОчакваме Ви!\nЕкипът на БК Гълъбово 🏸",
    variables: ["{ИМЕ}", "{ДЕТЕ}", "{СЪБИТИЕ}", "{ДАТА}", "{ЛИНК}"],
    isDefault: true,
  },
  {
    title: "🏸 Покана за вътрешен / регионален турнир",
    category: "tournament",
    channel: "viber",
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
    channel: "sms",
    subject: "Напомняне за подновяване на месечен абонамент",
    messageText:
      "Здравейте, {ИМЕ}! Напомняме Ви за подновяване на месечния абонамент за тренировки на {ДЕТЕ} за текущия месец. Можете да заплатите на рецепция в залата или по банков път. Благодарим за доверието!",
    variables: ["{ИМЕ}", "{ДЕТЕ}"],
    isDefault: true,
  },
  {
    title: "⏰ Промяна в график или зала",
    category: "schedule",
    channel: "whatsapp",
    subject: "Важно съобщение за промяна в графика на тренировките",
    messageText:
      "Здравейте, {ИМЕ}!\n\nУведомяваме Ви за промяна в тренировката на {ДАТА}:\nНов час: {ЧАС}\nЗала/Локация: {ЛОКАЦИЯ}\n\nМоля да потвърдите присъствието на {ДЕТЕ}.\nСпортни поздрави, БК Гълъбово",
    variables: ["{ИМЕ}", "{ДЕТЕ}", "{ДАТА}", "{ЧАС}", "{ЛОКАЦИЯ}"],
    isDefault: true,
  },
  {
    title: "🌟 Линк към клубна анкета за обратна връзка",
    category: "feedback",
    channel: "whatsapp",
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
      "Здравейте, {ИМЕ}!\n\nУспешно запазихте час на {ДАТА} от {ЧАС} за {ЛОКАЦИЯ}.\n\nОчакваме Ви в залата!\nТелефон за връзка при въпроси: 0888 123 456",
    variables: ["{ИМЕ}", "{ДАТА}", "{ЧАС}", "{ЛОКАЦИЯ}"],
    isDefault: true,
  },
];

export const marketingService = {
  // -------------------------------------------------------------
  // TEMPLATES
  // -------------------------------------------------------------
  async getTemplates(siteId: string): Promise<MarketingTemplate[]> {
    try {
      const q = query(
        collection(db, TEMPLATES_COLLECTION),
        where("siteId", "==", siteId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Seed default templates for this siteId
        const seeded: MarketingTemplate[] = [];
        for (const tmpl of DEFAULT_MARKETING_TEMPLATES) {
          const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
            ...tmpl,
            siteId,
            createdAt: new Date().toISOString(),
          });
          seeded.push({
            ...tmpl,
            id: docRef.id,
            siteId,
            createdAt: new Date().toISOString(),
          });
        }
        return seeded;
      }

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          siteId: data.siteId,
          title: data.title,
          category: data.category || "general",
          channel: data.channel || "whatsapp",
          subject: data.subject || "",
          messageText: data.messageText || "",
          variables: data.variables || [],
          isDefault: !!data.isDefault,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
        } as MarketingTemplate;
      });
    } catch (error) {
      console.error("Error fetching marketing templates:", error);
      return [];
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
      await updateDoc(ref, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating template:", error);
      throw error;
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    try {
      const ref = doc(db, TEMPLATES_COLLECTION, id);
      await deleteDoc(ref);
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
        orderBy("sentAt", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          siteId: data.siteId,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          recipientEmail: data.recipientEmail,
          channel: data.channel || "whatsapp",
          messageText: data.messageText,
          templateUsed: data.templateUsed,
          campaignTitle: data.campaignTitle,
          status: data.status || "sent",
          sentAt:
            data.sentAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          sentBy: data.sentBy,
        } as MarketingLog;
      });
    } catch (error) {
      console.error("Error fetching marketing history:", error);
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

      const byChannel: Record<"whatsapp" | "viber" | "sms" | "email", number> =
        {
          whatsapp: 0,
          viber: 0,
          sms: 0,
          email: 0,
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
      };
    } catch (error) {
      console.error("Error calculating marketing stats:", error);
      return {
        totalSent: 0,
        sentThisMonth: 0,
        byChannel: { whatsapp: 0, viber: 0, sms: 0, email: 0 },
        activeRecipientsCount: 0,
      };
    }
  },

  // -------------------------------------------------------------
  // AUTOMATIONS
  // -------------------------------------------------------------
  async getAutomationRules(siteId: string): Promise<MarketingAutomationRule[]> {
    try {
      const q = query(
        collection(db, AUTOMATIONS_COLLECTION),
        where("siteId", "==", siteId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const defaultRules: Omit<MarketingAutomationRule, "id">[] = [
          {
            siteId,
            title: "Автоматична покана за анкета 24ч след лагер",
            description:
              "Изпраща линк към клубната анкета до всички участници 24 часа след приключване на тренировъчен лагер.",
            triggerEvent: "post_camp_survey",
            delayHours: 24,
            channel: "whatsapp",
            isActive: true,
          },
          {
            siteId,
            title: "Покана за обратна връзка след състезателен турнир",
            description:
              "Изпраща благодарствено съобщение и линк за отзиви в рамките на 48 часа след финала на турнир.",
            triggerEvent: "post_tournament_survey",
            delayHours: 48,
            channel: "whatsapp",
            isActive: true,
          },
          {
            siteId,
            title: "Напомняне 3 дни преди изтичане на месечна такса",
            description:
              "Автоматично напомняне за подновяване на членството към родителите.",
            triggerEvent: "membership_expiring",
            delayHours: 72,
            channel: "sms",
            isActive: false,
          },
        ];

        const seeded: MarketingAutomationRule[] = [];
        for (const rule of defaultRules) {
          const ref = await addDoc(
            collection(db, AUTOMATIONS_COLLECTION),
            rule
          );
          seeded.push({ ...rule, id: ref.id });
        }
        return seeded;
      }

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          siteId: data.siteId,
          title: data.title,
          description: data.description,
          triggerEvent: data.triggerEvent,
          delayHours: data.delayHours || 24,
          channel: data.channel || "whatsapp",
          templateId: data.templateId,
          isActive: !!data.isActive,
        } as MarketingAutomationRule;
      });
    } catch (error) {
      console.error("Error fetching automations:", error);
      return [];
    }
  },

  async toggleAutomationRule(id: string, isActive: boolean): Promise<void> {
    try {
      const ref = doc(db, AUTOMATIONS_COLLECTION, id);
      await updateDoc(ref, { isActive });
    } catch (error) {
      console.error("Error toggling automation rule:", error);
      throw error;
    }
  },
};
