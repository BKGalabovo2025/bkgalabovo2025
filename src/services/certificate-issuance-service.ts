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
    note?: string
  ): Promise<IssuedCertificate> {
    const res = await redeemVoucherSessionAction(certificateId, note);
    if (!res.success || !res.updated) {
      throw new Error(res.error || "Неуспешно отчитане на процедура.");
    }
    return res.updated;
  },

  /**
   * Изтрива документ от регистъра
   */
  async deleteIssuedCertificate(id: string): Promise<void> {
    const res = await deleteIssuedCertificateAction(id);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно изтриване на документ.");
    }
  },
};
