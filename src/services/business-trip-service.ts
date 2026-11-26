import { v4 as uuidv4 } from "uuid";

import {
  addTripExpenseAction,
  assignMissingBusinessTripNumbersAction,
  createBusinessTripAction,
  deleteBusinessTripAction,
  deleteTripExpenseAction,
  getBusinessTripByIdAction,
  getBusinessTripsAction,
  getBusinessTripsByEventIdAction,
  getExpensesBySiteAction,
  getTripExpensesAction,
  logExpenseAttachmentDownloadAction,
  logTripProtocolDownloadAction,
  renumberAllBusinessTripsChronologicallyAction,
  updateBusinessTripAction,
  updateTripExpenseAction,
} from "@/lib/actions/business-trips";
import { uploadFile } from "@/services/storage-service";
import { BusinessTrip, TripExpense } from "@/types/business-trip.types";

export const businessTripService = {
  // ---------------------------------------------
  // TRIPS
  // ---------------------------------------------

  async createTrip(data: Omit<BusinessTrip, "id">): Promise<string> {
    const res = await createBusinessTripAction(data);
    if (!res.success || !res.id) {
      throw new Error(res.error || "Неуспешно създаване на командировката");
    }
    return res.id;
  },

  /**
   * Присвоява автоматични поредни номера (по календарна година на заповедта)
   * на всички командировки без номер и подменя старите "ID"-базирани номера
   * на решенията на УС. Ръчно въведени номера на решения не се пипат.
   * Използва Server Action (Admin SDK -> двупосочен запис в двете бази).
   */
  async assignMissingNumbers(siteId: string): Promise<number> {
    const res = await assignMissingBusinessTripNumbersAction(siteId);
    if (!res.success) {
      throw new Error(
        res.error || "Неуспешно присвояване на номера на командировки"
      );
    }
    return res.count || 0;
  },

  /**
   * Преномерира абсолютно всички командировки в хронологичен ред по startDate.
   * Актуализира Заповед № (1..N), Решение на УС (1..N-УС), Протокол (1..N-ПР)
   * и замества старите номера в съхранените текстове на протоколи и доклади.
   */
  async renumberAllTripsChronologically(siteId: string): Promise<number> {
    const res = await renumberAllBusinessTripsChronologicallyAction(siteId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно преномериране на командировките");
    }
    return res.count || 0;
  },

  async updateTrip(id: string, data: Partial<BusinessTrip>): Promise<void> {
    const res = await updateBusinessTripAction(id, data);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно обновяване на командировката");
    }
  },

  async getTrips(siteId: string): Promise<BusinessTrip[]> {
    const res = await getBusinessTripsAction(siteId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно зареждане на командировките");
    }
    return res.data || [];
  },

  async getTripsByEventId(
    eventId: string,
    siteId: string = "bkgalabovo"
  ): Promise<BusinessTrip[]> {
    const res = await getBusinessTripsByEventIdAction(eventId, siteId);
    if (!res.success) {
      throw new Error(
        res.error || "Неуспешно зареждане на командировките за събитието"
      );
    }
    return res.data || [];
  },

  /**
   * Връща всички командировки, в които даден член участва:
   * било като състезател (в participantsIds) или като ръководител (coachId).
   */
  async getTripsByMemberId(
    memberId: string,
    siteId: string = "bkgalabovo"
  ): Promise<BusinessTrip[]> {
    const allTrips = await this.getTrips(siteId);
    return allTrips.filter(
      (trip) =>
        trip.coachId === memberId ||
        (Array.isArray(trip.participantsIds) &&
          trip.participantsIds.includes(memberId)) ||
        Boolean(trip.additionalVehicles?.some((av) => av.driverId === memberId))
    );
  },

  async getTripById(id: string): Promise<BusinessTrip | null> {
    const res = await getBusinessTripByIdAction(id);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно зареждане на командировката");
    }
    return res.data ?? null;
  },

  async deleteTrip(id: string): Promise<void> {
    const res = await deleteBusinessTripAction(id);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно изтриване на командировката");
    }
  },

  // ---------------------------------------------
  // EXPENSES
  // ---------------------------------------------

  async addExpense(data: Omit<TripExpense, "id">): Promise<string> {
    const res = await addTripExpenseAction(data);
    if (!res.success || !res.id) {
      throw new Error(res.error || "Неуспешно добавяне на разхода");
    }
    return res.id;
  },

  async getExpensesByTrip(
    tripId: string,
    siteId?: string
  ): Promise<TripExpense[]> {
    const res = await getTripExpensesAction(tripId, siteId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно зареждане на разходите");
    }
    return res.data || [];
  },

  async getExpensesBySite(siteId: string): Promise<TripExpense[]> {
    const res = await getExpensesBySiteAction(siteId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно зареждане на разходите");
    }
    return res.data || [];
  },

  async deleteExpense(id: string): Promise<void> {
    const res = await deleteTripExpenseAction(id);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно изтриване на разхода");
    }
  },

  async updateExpense(id: string, data: Partial<TripExpense>): Promise<void> {
    const res = await updateTripExpenseAction(id, data);
    if (!res.success) {
      throw new Error(res.error || "Неуспешно обновяване на разхода");
    }
  },

  /** Записва дата/час на сваляне на прикачен документ към разход */
  async logExpenseAttachmentDownload(expenseId: string): Promise<void> {
    const res = await logExpenseAttachmentDownloadAction(expenseId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешен запис на свалянето");
    }
  },

  // ---------------------------------------------
  // ATTACHMENTS (Storage)
  // ---------------------------------------------

  async uploadExpenseDocument(
    siteId: string,
    tripId: string,
    file: File,
    idToken?: string | null
  ): Promise<string> {
    const rawExt = file.name.includes(".") ? file.name.split(".").pop() : "";
    const fileExtension =
      (rawExt || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Използва server-side /api/upload за да избегне CORS проблеми
    // (същият механизъм като качването на наредби в графика)
    const storagePath = `sites/${siteId}/business-trips/${tripId}/${fileName}`;
    return await uploadFile(storagePath, file, idToken);
  },

  /** Качване на официален протокол от срещите (съдийски протокол) */
  async uploadTripProtocolDocument(
    siteId: string,
    tripId: string,
    file: File,
    idToken?: string | null
  ): Promise<string> {
    const rawExt = file.name.includes(".") ? file.name.split(".").pop() : "";
    const fileExtension =
      (rawExt || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storagePath = `sites/${siteId}/business-trips/${tripId}/protocols/${fileName}`;
    return await uploadFile(storagePath, file, idToken);
  },

  /** Записва дата/час на сваляне на прикачен протокол към командировка */
  async logTripProtocolDownload(
    tripId: string,
    protocolId?: string
  ): Promise<void> {
    const res = await logTripProtocolDownloadAction(tripId, protocolId);
    if (!res.success) {
      throw new Error(res.error || "Неуспешен запис на свалянето на протокола");
    }
  },
};
