import { doc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";

import { getDb } from "@/lib/firebase";
import {
  mapDocToEntry,
  mapDocToMatch,
  mapDocToTournament,
} from "@/mappers/tournament.mapper";
import {
  deleteMatchesByTournamentBatch,
  deleteTournamentCascading,
  deleteTournamentEntryDoc,
  fetchTournamentById,
  fetchTournamentEntries,
  fetchTournamentMatches,
  fetchTournaments,
  insertMatchesBatch,
  insertTournament,
  insertTournamentEntry,
  updateMatchDoc,
  updateTournamentDoc,
} from "@/repositories/tournament.repository";
import {
  Match,
  Tournament,
  TournamentEntry,
  TournamentSchema,
} from "@/types/tournament.types";

async function syncScheduleEventLink(
  prevEventId: string | null | undefined,
  nextEventId: string | null | undefined,
  tournamentId: string
): Promise<void> {
  const db = getDb();
  if (!db) return;

  if (prevEventId && prevEventId !== nextEventId) {
    try {
      await updateDoc(doc(db, "events", prevEventId), {
        tournamentId: null,
      });
    } catch (err) {
      console.warn("Could not unlink previous schedule event:", err);
    }
  }

  if (nextEventId) {
    try {
      await updateDoc(doc(db, "events", nextEventId), {
        tournamentId,
      });
    } catch (err) {
      console.warn("Could not link schedule event:", err);
    }
  }
}

export const tournamentService = {
  /**
   * Взема всички турнири
   */
  async getTournaments(): Promise<Tournament[]> {
    try {
      const docs = await fetchTournaments();
      return docs.map(mapDocToTournament);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      throw error;
    }
  },

  /**
   * Взема конкретен турнир по ID
   */
  async getTournamentById(id: string): Promise<Tournament | null> {
    try {
      const docSnap = await fetchTournamentById(id);
      if (!docSnap) return null;
      return mapDocToTournament(docSnap);
    } catch (error) {
      console.error("Error fetching tournament by id:", error);
      throw error;
    }
  },

  /**
   * Създава нов турнир
   */
  async createTournament(data: Omit<Tournament, "id">): Promise<string> {
    try {
      // Валидация преди запис (Бизнес логика/Схема)
      const validatedData = TournamentSchema.omit({ id: true }).parse(data);

      const payload = {
        ...validatedData,
        startDate: Timestamp.fromDate(new Date(validatedData.startDate)),
        endDate: Timestamp.fromDate(new Date(validatedData.endDate)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const createdId = await insertTournament(payload);
      if (validatedData.scheduleEventId) {
        await syncScheduleEventLink(
          null,
          validatedData.scheduleEventId,
          createdId
        );
      }
      return createdId;
    } catch (error) {
      console.error("Error creating tournament:", error);
      throw error;
    }
  },

  /**
   * Обновява съществуващ турнир
   */
  async updateTournament(id: string, data: Partial<Tournament>): Promise<void> {
    try {
      let prevEventId: string | null | undefined;
      if (data.scheduleEventId !== undefined) {
        const existing = await this.getTournamentById(id);
        prevEventId = existing?.scheduleEventId;
      }

      const payload: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      if (data.startDate) {
        payload.startDate = Timestamp.fromDate(new Date(data.startDate));
      }
      if (data.endDate) {
        payload.endDate = Timestamp.fromDate(new Date(data.endDate));
      }

      await updateTournamentDoc(id, payload);

      if (data.scheduleEventId !== undefined) {
        await syncScheduleEventLink(prevEventId, data.scheduleEventId, id);
      }
    } catch (error) {
      console.error("Error updating tournament:", error);
      throw error;
    }
  },

  /**
   * Изтрива турнир
   */
  async deleteTournament(id: string): Promise<void> {
    try {
      const existing = await this.getTournamentById(id);
      await deleteTournamentCascading(id);
      if (existing?.scheduleEventId) {
        await syncScheduleEventLink(existing.scheduleEventId, null, id);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
      throw error;
    }
  },

  // ──────────────────────────────────────────────
  // Entries (Записвания)
  // ──────────────────────────────────────────────

  async getTournamentEntries(tournamentId: string): Promise<TournamentEntry[]> {
    try {
      const docs = await fetchTournamentEntries(tournamentId);
      return docs.map(mapDocToEntry);
    } catch (error) {
      console.error("Error fetching entries:", error);
      throw error;
    }
  },

  async createTournamentEntry(
    data: Omit<TournamentEntry, "id">
  ): Promise<string> {
    try {
      const payload = {
        ...data,
        registrationDate: serverTimestamp(),
      };
      return await insertTournamentEntry(payload);
    } catch (error) {
      console.error("Error creating entry:", error);
      throw error;
    }
  },

  async deleteTournamentEntry(id: string): Promise<void> {
    try {
      await deleteTournamentEntryDoc(id);
    } catch (error) {
      console.error("Error deleting entry:", error);
      throw error;
    }
  },

  // ──────────────────────────────────────────────
  // Matches (Мачове)
  // ──────────────────────────────────────────────

  async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    try {
      const docs = await fetchTournamentMatches(tournamentId);
      return docs.map(mapDocToMatch);
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
  },

  async createMatches(matches: Omit<Match, "id">[]): Promise<void> {
    try {
      const payloadMatches = matches.map((m) => ({
        ...m,
        status: m.status || "pending",
        updatedAt: serverTimestamp(),
      }));
      await insertMatchesBatch(payloadMatches);
    } catch (error) {
      console.error("Error creating matches:", error);
      throw error;
    }
  },

  async deleteMatchesByTournament(tournamentId: string): Promise<void> {
    try {
      await deleteMatchesByTournamentBatch(tournamentId);
    } catch (error) {
      console.error("Error deleting tournament matches:", error);
      throw error;
    }
  },

  async updateMatchScore(id: string, data: Partial<Match>): Promise<void> {
    try {
      const payload = {
        ...data,
        status: "completed",
        updatedAt: serverTimestamp(),
      };
      await updateMatchDoc(id, payload);
    } catch (error) {
      console.error("Error updating match:", error);
      throw error;
    }
  },
};
