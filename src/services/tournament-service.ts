import { getDb } from "@/lib/firebase";

const db = getDb();
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

const TOURNAMENTS_COLLECTION = "tournaments";

// Utility to parse Firestore docs to our Tournament type
function docToTournament(docSnapshot: any): Tournament {
  const data = docSnapshot.data();

  return TournamentSchema.parse({
    ...data,
    id: docSnapshot.id,
    startDate: data.startDate?.toDate
      ? data.startDate.toDate().toISOString()
      : data.startDate,
    endDate: data.endDate?.toDate
      ? data.endDate.toDate().toISOString()
      : data.endDate,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate().toISOString()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt,
  });
}

export const tournamentService = {
  /**
   * Взема всички турнири
   */
  async getTournaments(): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, TOURNAMENTS_COLLECTION),
        orderBy("startDate", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToTournament);
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
      const docRef = doc(db, TOURNAMENTS_COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return docToTournament(snapshot);
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
      const docRef = doc(db, TOURNAMENTS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting tournament:", error);
      throw error;
    }
  },

  // -----------------------------------------------------
  // УЧАСТНИЦИ (ENTRIES)
  // -----------------------------------------------------

  /**
   * Взема всички записани участници за даден турнир
   */
  async getTournamentEntries(tournamentId: string): Promise<TournamentEntry[]> {
    try {
      const q = query(
        collection(db, "tournament_entries"),
        where("tournamentId", "==", tournamentId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          ...data,
          id: docSnapshot.id,
          registrationDate: data.registrationDate?.toDate
            ? data.registrationDate.toDate().toISOString()
            : data.registrationDate,
        } as TournamentEntry;
      });
    } catch (error) {
      console.error("Error fetching tournament entries:", error);
      throw error;
    }
  },

  /**
   * Добавя участник/двойка към турнир
   */
  async createTournamentEntry(
    entry: Omit<TournamentEntry, "id" | "registrationDate">
  ): Promise<string> {
    try {
      // Премахваме всички undefined полета, за да не гърми Firestore
      const cleanEntry = Object.fromEntries(
        Object.entries(entry).filter(([_, v]) => v !== undefined)
      );

      const docRef = await addDoc(collection(db, "tournament_entries"), {
        ...cleanEntry,
        registrationDate: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating tournament entry:", error);
      throw error;
    }
  },

  /**
   * Изтрива записване (участник)
   */
  async deleteTournamentEntry(entryId: string): Promise<void> {
    try {
      const docRef = doc(db, "tournament_entries", entryId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting tournament entry:", error);
      throw error;
    }
  },

  // -----------------------------------------------------
  // МАЧОВЕ (MATCHES)
  // -----------------------------------------------------

  async getTournamentMatches(tournamentId: string): Promise<Match[]> {
    try {
      const q = query(
        collection(db, "tournament_matches"),
        where("tournamentId", "==", tournamentId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Match);
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
  },

  async createMatches(matches: Omit<Match, "id">[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      matches.forEach((match) => {
        const docRef = doc(collection(db, "tournament_matches"));
        batch.set(docRef, match);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error creating matches:", error);
      throw error;
    }
  },

  async updateMatch(matchId: string, data: Partial<Match>): Promise<void> {
    try {
      await updateDoc(doc(db, "tournament_matches", matchId), data as any);
    } catch (error) {
      console.error("Error updating match:", error);
      throw error;
    }
  },

  async updateMatchScore(
    matchId: string,
    result: { score: string; winnerEntryId: string }
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "tournament_matches", matchId), {
        ...result,
        status: "completed",
        updatedAt: serverTimestamp(),
      } as any);
    } catch (error) {
      console.error("Error updating match score:", error);
      throw error;
    }
  },

  async deleteMatchesByTournament(tournamentId: string): Promise<void> {
    try {
      const q = query(
        collection(db, "tournament_matches"),
        where("tournamentId", "==", tournamentId)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (error) {
      console.error("Error deleting matches:", error);
      throw error;
    }
  },
};
