import {
  createSponsorAction,
  deleteSponsorAction,
  getSponsorsAction,
  seedInitialSponsorsAction,
  toggleSponsorActiveAction,
  updateSponsorAction,
} from "@/lib/actions/sponsors-server";
import {
  DEFAULT_INITIAL_SPONSORS,
  SponsorPartner,
  SponsorPartnerCreateInput,
  SponsorPartnerUpdateInput,
} from "@/types/certificates";

export { DEFAULT_INITIAL_SPONSORS };

export const sponsorService = {
  /**
   * Извлича всички спонсори/партньори за дадения клон (siteId)
   * Използва сървърен екшън с Firebase Admin SDK за надеждност и предотвратяване на грешки от клиентски права
   */
  async getSponsors(
    siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
  ): Promise<SponsorPartner[]> {
    try {
      const res = await getSponsorsAction(siteId);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(
        "Грешка при извличане през сървърен екшън, зареждане на начални:",
        err
      );
    }

    return DEFAULT_INITIAL_SPONSORS.filter((s) => s.siteId === siteId).map(
      (s, idx) => ({
        ...s,
        id: `${siteId}_sponsor_default_${idx}`,
        createdAt: new Date().toISOString(),
      })
    );
  },

  /**
   * Създава нов партньор през защитен сървърен екшън
   */
  async createSponsor(
    siteId: "bkgalabovo" | "recoveryzone",
    data: SponsorPartnerCreateInput
  ): Promise<string> {
    const res = await createSponsorAction(siteId, data);
    if (!res.success || !res.id) {
      throw new Error(res.error || "Неуспешно създаване на партньор.");
    }
    return res.id;
  },

  /**
   * Обновява партньор през защитен сървърен екшън
   */
  async updateSponsor(
    id: string,
    data: SponsorPartnerUpdateInput,
    siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
  ): Promise<void> {
    const res = await updateSponsorAction(id, data, siteId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно обновяване на партньор.");
    }
  },

  /**
   * Превключва статус на активност
   */
  async toggleSponsorActive(
    id: string,
    isActive: boolean,
    siteId: "bkgalabovo" | "recoveryzone" = "bkgalabovo"
  ): Promise<void> {
    const res = await toggleSponsorActiveAction(id, isActive, siteId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешна промяна на статус.");
    }
  },

  /**
   * Изтрива партньор
   */
  async deleteSponsor(id: string): Promise<void> {
    const res = await deleteSponsorAction(id);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно изтриване на партньор.");
    }
  },

  /**
   * Инициализира препоръчителни спонсори в базата данни
   */
  async seedInitialSponsors(
    siteId: "bkgalabovo" | "recoveryzone"
  ): Promise<void> {
    const res = await seedInitialSponsorsAction(siteId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешна инициализация на спонсори.");
    }
  },
};
