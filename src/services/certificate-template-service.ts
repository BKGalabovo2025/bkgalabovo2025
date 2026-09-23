import {
  createTemplateAction,
  deleteTemplateAction,
  getTemplatesAction,
  seedInitialTemplatesAction,
  updateTemplateAction,
} from "@/lib/actions/certificate-templates-server";
import {
  CertificateTemplate,
  CertificateTemplateCreateInput,
  CertificateTemplateUpdateInput,
  DEFAULT_CERTIFICATE_TEMPLATES,
} from "@/types/certificates";

export { DEFAULT_CERTIFICATE_TEMPLATES };

export const certificateTemplateService = {
  /**
   * Извлича всички шаблони за дадения клон
   */
  async getTemplates(
    siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
  ): Promise<CertificateTemplate[]> {
    try {
      const res = await getTemplatesAction(siteId);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(
        "Грешка при извличане на шаблони, зареждане на начални:",
        err
      );
    }

    return DEFAULT_CERTIFICATE_TEMPLATES.filter((t) => t.siteId === siteId).map(
      (t, idx) => ({
        ...t,
        id: `${siteId}_tmpl_default_${idx}`,
        createdAt: new Date().toISOString(),
      })
    ) as CertificateTemplate[];
  },

  /**
   * Създава нов шаблон
   */
  async createTemplate(
    siteId: "bkgalabovo" | "recoveryzone",
    data: CertificateTemplateCreateInput
  ): Promise<string> {
    const res = await createTemplateAction(siteId, data);
    if (!res.success || !res.id) {
      throw new Error(res.error || "Неуспешно създаване на шаблон.");
    }
    return res.id;
  },

  /**
   * Обновява шаблон
   */
  async updateTemplate(
    id: string,
    data: CertificateTemplateUpdateInput,
    siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
  ): Promise<void> {
    const res = await updateTemplateAction(id, data, siteId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно обновяване на шаблон.");
    }
  },

  /**
   * Превключва одобрен статус (draft -> approved)
   */
  async toggleTemplateStatus(
    id: string,
    newStatus: "draft" | "approved",
    siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
  ): Promise<void> {
    const res = await updateTemplateAction(id, { status: newStatus }, siteId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешна промяна на статуса.");
    }
  },

  /**
   * Изтрива шаблон
   */
  async deleteTemplate(id: string): Promise<void> {
    const res = await deleteTemplateAction(id);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно изтриване на шаблон.");
    }
  },

  /**
   * Записва препоръчителните начални шаблони в базата данни
   */
  async seedInitialTemplates(
    siteId: "bkgalabovo" | "recoveryzone"
  ): Promise<void> {
    const res = await seedInitialTemplatesAction(siteId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешна инициализация на шаблони.");
    }
  },
};
