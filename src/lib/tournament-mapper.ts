import {
  Tournament,
  TournamentSchema,
  TournamentEntry,
  Match,
} from "@/types/tournament.types";

/**
 * Maps a Firestore document snapshot to a Tournament object,
 * handling Timestamp to ISO string conversions and Zod validation.
 */
export function mapDocToTournament(docSnapshot: any): Tournament {
  const data = docSnapshot.data();

  try {
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
  } catch (error) {
    console.warn(`Validation failed for tournament ${docSnapshot.id}:`, error);
    // Fallback to raw data with ID if validation fails (to avoid breaking the whole list)
    return { ...data, id: docSnapshot.id } as Tournament;
  }
}

/**
 * Maps a Firestore document snapshot to a TournamentEntry object.
 */
export function mapDocToEntry(docSnapshot: any): TournamentEntry {
  const data = docSnapshot.data();
  return {
    ...data,
    id: docSnapshot.id,
    registrationDate: data.registrationDate?.toDate
      ? data.registrationDate.toDate().toISOString()
      : data.registrationDate,
  } as TournamentEntry;
}

/**
 * Maps a Firestore document snapshot to a Match object.
 */
export function mapDocToMatch(docSnapshot: any): Match {
  const data = docSnapshot.data();
  return {
    ...data,
    id: docSnapshot.id,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt,
  } as Match;
}
