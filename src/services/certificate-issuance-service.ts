import {
  deleteIssuedCertificateAction,
  getCertificateByIdAction,
  getIssuedCertificatesAction,
  issueCertificateAction,
  redeemVoucherSessionAction,
} from "@/lib/actions/certificate-issuance-server";
import { IssueCertificateInput, IssuedCertificate } from "@/types/certificates";

export const certificateIssuanceService = {
  /**
   * Издава нов персонален сертификат/грамота/ваучер
   */
  async issueCertificate(
    siteId: "bkgalabovo" | "recoveryzone",
    input: IssueCertificateInput
  ): Promise<IssuedCertificate> {
    const res = await issueCertificateAction(siteId, input);
    if (!res.success || !res.data) {
      throw new Error(res.error || "Неуспешно издаване на сертификат.");
    }

    // Синхронизиране в локалния кеш за бързо визуализиране
    if (typeof window !== "undefined" && res.data) {
      try {
        const cacheKey = `bkg_cached_certificates_${siteId}`;
        const raw = localStorage.getItem(cacheKey);
        const list: IssuedCertificate[] = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)) {
          const filtered = list.filter((c) => c.id !== res.data!.id);
          localStorage.setItem(
            cacheKey,
            JSON.stringify([res.data, ...filtered])
          );
        }
      } catch {
        // ignore cache write error
      }
    }

    return res.data;
  },

  /**
   * Извлича всички издадени документи за дадения клон
   */
  async getIssuedCertificates(
    siteId: "bkgalabovo" | "recoveryzone"
  ): Promise<IssuedCertificate[]> {
    const res = await getIssuedCertificatesAction(siteId);
    if (!res.success) {
      console.warn("Грешка при извличане на издадени документи:", res.error);
      return [];
    }
    return res.data || [];
  },

  /**
   * Извлича конкретен документ по ID (за валидация и преглед)
   */
  async getCertificateById(id: string): Promise<IssuedCertificate | null> {
    const res = await getCertificateByIdAction(id);
    if (!res.success || !res.data) {
      return null;
    }
    return res.data;
  },

  /**
   * Отчита ползване на процедура от ваучер
   */
  async redeemVoucherSession(
    certificateId: string,
    note?: string,
    fallbackCertificate?: IssuedCertificate
  ): Promise<IssuedCertificate> {
    const res = await redeemVoucherSessionAction(
      certificateId,
      note,
      fallbackCertificate
    );
    if (!res.success || !res.updated) {
      throw new Error(res.error || "Неуспешно отчитане на процедура.");
    }

    // Синхронизиране в локалния кеш веднага
    if (typeof window !== "undefined" && res.updated) {
      try {
        const siteId = res.updated.siteId || "bkgalabovo";
        const cacheKey = `bkg_cached_certificates_${siteId}`;
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const list: IssuedCertificate[] = JSON.parse(raw);
          if (Array.isArray(list)) {
            const idx = list.findIndex(
              (c) =>
                c.id === res.updated!.id ||
                c.serialNumber === res.updated!.serialNumber
            );
            if (idx >= 0) {
              list[idx] = res.updated;
            } else {
              list.unshift(res.updated);
            }
            localStorage.setItem(cacheKey, JSON.stringify(list));
          }
        }
      } catch {
        // ignore cache write error
      }
    }

    return res.updated;
  },

  /**
   * Изтрива документ от регистъра
   */
  async deleteIssuedCertificate(
    id: string,
    siteId?: "bkgalabovo" | "recoveryzone"
  ): Promise<void> {
    const res = await deleteIssuedCertificateAction(id);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно изтриване на документ.");
    }

    // Синхронизиране в локалния кеш
    if (typeof window !== "undefined" && siteId) {
      try {
        const cacheKey = `bkg_cached_certificates_${siteId}`;
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const list: IssuedCertificate[] = JSON.parse(raw);
          if (Array.isArray(list)) {
            const filtered = list.filter(
              (c) => c.id !== id && c.serialNumber !== id
            );
            localStorage.setItem(cacheKey, JSON.stringify(filtered));
          }
        }
      } catch {
        // ignore cache write error
      }
    }
  },
};
