import {
  addDoc,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { getDb } from "@/lib/firebase";
import {
  getTournamentEntriesCollection,
  getTournamentEntriesQuery,
  getTournamentMatchesCollection,
  getTournamentMatchesQuery,
  getTournamentsCollection,
  getTournamentsQuery,
} from "@/lib/firebase-collections";

/**
 * Взема всички турнири
 */
export const fetchTournaments = async (): Promise<DocumentSnapshot[]> => {
  const q = query(getTournamentsQuery(), orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs;
};

/**
 * Взема турнир по ID
 */
export const fetchTournamentById = async (
  id: string
): Promise<DocumentSnapshot | null> => {
  const docRef = doc(getTournamentsCollection(), id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot : null;
};

/**
 * Създава нов турнир
 */
export const insertTournament = async (
  payload: Record<string, unknown>
): Promise<string> => {
  const docRef = await addDoc(getTournamentsCollection(), payload);
  return docRef.id;
};

/**
 * Обновява турнир
 */
export const updateTournamentDoc = async (
  id: string,
  payload: Record<string, unknown>
): Promise<void> => {
  const docRef = doc(getTournamentsCollection(), id);
  await updateDoc(docRef, payload);
};

/**
 * Изтрива турнир
 */
export const deleteTournamentDoc = async (id: string): Promise<void> => {
  const docRef = doc(getTournamentsCollection(), id);
  await deleteDoc(docRef);
};

/**
 * Взема записванията за турнир
 */
export const fetchTournamentEntries = async (
  tournamentId: string
): Promise<DocumentSnapshot[]> => {
  const q = query(
    getTournamentEntriesQuery(),
    where("tournamentId", "==", tournamentId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs;
};

/**
 * Създава записване
 */
export const insertTournamentEntry = async (
  payload: Record<string, unknown>
): Promise<string> => {
  const docRef = await addDoc(getTournamentEntriesCollection(), payload);
  return docRef.id;
};

/**
 * Изтрива записване
 */
export const deleteTournamentEntryDoc = async (id: string): Promise<void> => {
  const docRef = doc(getTournamentEntriesCollection(), id);
  await deleteDoc(docRef);
};

/**
 * Взема мачовете за турнир
 */
export const fetchTournamentMatches = async (
  tournamentId: string
): Promise<DocumentSnapshot[]> => {
  const q = query(
    getTournamentMatchesQuery(),
    where("tournamentId", "==", tournamentId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs;
};

/**
 * Създава множество мачове (Batch)
 */
export const insertMatchesBatch = async (
  matches: Record<string, unknown>[]
): Promise<void> => {
  const db = getDb();
  const batch = writeBatch(db);

  matches.forEach((m) => {
    const docRef = doc(getTournamentMatchesCollection());
    batch.set(docRef, m);
  });

  await batch.commit();
};

/**
 * Изтрива всички мачове за турнир (Batch)
 */
export const deleteMatchesByTournamentBatch = async (
  tournamentId: string
): Promise<void> => {
  const db = getDb();
  const q = query(
    getTournamentMatchesQuery(),
    where("tournamentId", "==", tournamentId)
  );
  const snapshot = await getDocs(q);

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.delete(d.ref);
  });

  await batch.commit();
};

/**
 * Обновява мач
 */
export const updateMatchDoc = async (
  id: string,
  payload: Record<string, unknown>
): Promise<void> => {
  const docRef = doc(getTournamentMatchesCollection(), id);
  await updateDoc(docRef, payload);
};
