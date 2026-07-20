import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MarketingLog, MarketingLogFormData } from "@/types/marketing.types";

const COLLECTION_NAME = "marketing_history";

export const marketingService = {
  /**
   * Записва ново изпратено съобщение в историята.
   */
  async logMessage(data: MarketingLogFormData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        sentAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error logging marketing message:", error);
      throw error;
    }
  },

  /**
   * Извлича цялата история за даден сайт.
   */
  async getHistory(siteId: string): Promise<MarketingLog[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("siteId", "==", siteId),
        orderBy("sentAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          siteId: data.siteId,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          messageText: data.messageText,
          templateUsed: data.templateUsed,
          sentAt:
            data.sentAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          sentBy: data.sentBy,
        } as MarketingLog;
      });
    } catch (error) {
      console.error("Error fetching marketing history:", error);
      throw error;
    }
  },
};
