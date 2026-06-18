import {
  Tournament,
  TournamentSchema,
  TournamentEntry,
  Match,
} from "@/types/tournament.types";
import type { DocumentSnapshot } from "firebase/firestore";

type FirestoreDate = { toDate?: () => Date } | Date | string | null | undefined;

export const toISODate = (date: FirestoreDate): string | undefined => {
  if (!date) return undefined;
  if (typeof (date as { toDate?: () => Date }).toDate === "function") {
    return (date as { toDate: () => Date }).toDate().toISOString();
  }
  return date instanceof Date ? date.toISOString() : (date as string);
};

/**
 * Maps a Firestore document snapshot to a Tournament object,
 * handling Timestamp to ISO string conversions and Zod validation.
 */
export function mapDocToTournament(docSnapshot: DocumentSnapshot): Tournament {
  const data = docSnapshot.data();
  if (!data) return { id: docSnapshot.id } as Tournament;



  try {
    return TournamentSchema.parse({
      ...data,
      id: docSnapshot.id,
      startDate: toISODate(data.startDate),
      endDate: toISODate(data.endDate),
      createdAt: toISODate(data.createdAt),
      updatedAt: toISODate(data.updatedAt),
    });
  } catch (error) {
    console.warn(`Validation failed for tournament ${docSnapshot.id}:`, error);
    // Fallback to raw data with ID if validation fails (to avoid breaking the whole list)
    return { ...data, id: docSnapshot.id } as Tournament;
  }
}

/**
 * Maps a Firestore document snapshot to a TournamentEntry object.
 */
export function mapDocToEntry(docSnapshot: DocumentSnapshot): TournamentEntry {
  const data = docSnapshot.data();
  if (!data) return { id: docSnapshot.id } as unknown as TournamentEntry;



  return {
    ...data,
    id: docSnapshot.id,
    registrationDate: toISODate(data.registrationDate),
  } as TournamentEntry;
}

/**
 * Maps a Firestore document snapshot to a Match object.
 */
export function mapDocToMatch(docSnapshot: DocumentSnapshot): Match {
  const data = docSnapshot.data();
  if (!data) return { id: docSnapshot.id } as unknown as Match;



  return {
    ...data,
    id: docSnapshot.id,
    updatedAt: toISODate(data.updatedAt),
  } as unknown as Match;
}
