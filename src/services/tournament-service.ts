import { getDb } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  writeBatch,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import {
  Tournament,
  TournamentEntry,
  Match,
  TournamentSchema,
} from "@/types/tournament.types";
import {
  mapDocToTournament,
  mapDocToEntry,
  mapDocToMatch,
} from "@/lib/tournament-mapper";

const TOURNAMENTS_COLLECTION = "tournaments";
const ENTRIES_COLLECTION = "tournament-entries";
const MATCHES_COLLECTION = "tournament-matches";

export const tournamentService = {
  /**
   * Взема всички турнири
   */
  async getTournaments(): Promise<Tournament[]> {
    try {
      const db = getDb();
      const q = query(
        collection(db, TOURNAMENTS_COLLECTION),
        orderBy("startDate", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(mapDocToTournament);
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
      const db = getDb();
      const docRef = doc(db, TOURNAMENTS_COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return mapDocToTournament(snapshot);
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
      const db = getDb();
      // Валидация преди запис
      const validatedData = TournamentSchema.omit({ id: true }).parse(data);

      const payload = {
        ...validatedData,
        startDate: Timestamp.fromDate(new Date(validatedData.startDate)),
        endDate: Timestamp.fromDate(new Date(validatedData.endDate)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, TOURNAMENTS_COLLECTION),
        payload
      );
      return docRef.id;
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
      const db = getDb();
      const docRef = doc(db, TOURNAMENTS_COLLECTION, id);
      const payload: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      if (data.startDate) {
        payload.startDate = Timestamp.fromDate(new Date(data.startDate));
      }
      if (data.endDate) {
        payload.endDate = Timestamp.fromDate(new Date(data.endDate));
      }

      await updateDoc(docRef, payload);
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
      const db = getDb();
      const docRef = doc(db, TOURNAMENTS_COLLECTION, id);
      await deleteDoc(docRef);
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
      const db = getDb();
      const q = query(
        collection(db, ENTRIES_COLLECTION),
        where("tournamentId", "==", tournamentId)
        // Removed orderBy to avoid index errors, sorting handled client-side
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(mapDocToEntry);
    } catch (error) {
      console.error("Error fetching entries:", error);
      throw error;
    }
  },

  async createTournamentEntry(
    data: Omit<TournamentEntry, "id">
  ): Promise<string> {
    try {
      const db = getDb();
      const payload = {
        ...data,
        registrationDate: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, ENTRIES_COLLECTION), payload);
      return docRef.id;
    } catch (error) {
      console.error("Error creating entry:", error);
      throw error;
    }
  },

  async deleteTournamentEntry(id: string): Promise<void> {
    try {
      const db = getDb();
      await deleteDoc(doc(db, ENTRIES_COLLECTION, id));
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
      const db = getDb();
      const q = query(
        collection(db, MATCHES_COLLECTION),
        where("tournamentId", "==", tournamentId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(mapDocToMatch);
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
  },

  async createMatches(matches: Omit<Match, "id">[]): Promise<void> {
    try {
      const db = getDb();
      const batch = writeBatch(db);
      matches.forEach((m) => {
        const docRef = doc(collection(db, MATCHES_COLLECTION));
        batch.set(docRef, {
          ...m,
          status: m.status || "pending",
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error creating matches:", error);
      throw error;
    }
  },

  async deleteMatchesByTournament(tournamentId: string): Promise<void> {
    try {
      const db = getDb();
      const q = query(
        collection(db, MATCHES_COLLECTION),
        where("tournamentId", "==", tournamentId)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error deleting tournament matches:", error);
      throw error;
    }
  },

  async updateMatchScore(id: string, data: Partial<Match>): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, MATCHES_COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        status: "completed",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating match:", error);
      throw error;
    }
  },
};
