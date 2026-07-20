import {
  Tournament,
  TournamentEntry,
  Match,
  TournamentSchema,
} from "@/types/tournament.types";
import { Timestamp, serverTimestamp } from "firebase/firestore";

import {
  mapDocToTournament,
  mapDocToEntry,
  mapDocToMatch,
} from "@/mappers/tournament.mapper";

import {
  fetchTournaments,
  fetchTournamentById,
  insertTournament,
  updateTournamentDoc,
  deleteTournamentDoc,
  fetchTournamentEntries,
  insertTournamentEntry,
  deleteTournamentEntryDoc,
  fetchTournamentMatches,
  insertMatchesBatch,
  deleteMatchesByTournamentBatch,
  updateMatchDoc,
} from "@/repositories/tournament.repository";

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

      return await insertTournament(payload);
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
      await deleteTournamentDoc(id);
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
