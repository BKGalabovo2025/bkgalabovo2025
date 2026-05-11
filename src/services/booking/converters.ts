import { 
  FirestoreDataConverter, 
  QueryDocumentSnapshot, 
  SnapshotOptions,
  Timestamp 
} from "firebase/firestore";
import { Reservation, FirestoreReservation } from "@/types/booking.types";

/**
 * Firestore converter for Reservation documents.
 * Handles conversion between Firestore Timestamps and ISO strings/Dates.
 */
export const reservationConverter: FirestoreDataConverter<Reservation> = {
  toFirestore(reservation: Reservation): FirestoreReservation {
    return {
      ...reservation,
      startTime: Timestamp.fromDate(new Date(reservation.startTime)),
      endTime: Timestamp.fromDate(new Date(reservation.endTime)),
      clientStartTime: Timestamp.fromDate(new Date(reservation.clientStartTime)),
      clientEndTime: Timestamp.fromDate(new Date(reservation.clientEndTime)),
      createdAt: reservation.createdAt ? Timestamp.fromDate(new Date(reservation.createdAt)) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Reservation {
    const data = snapshot.data(options) as FirestoreReservation;
    return {
      ...data,
      id: snapshot.id,
      startTime: data.startTime.toDate().toISOString(),
      endTime: data.endTime.toDate().toISOString(),
      clientStartTime: data.clientStartTime.toDate().toISOString(),
      clientEndTime: data.clientEndTime.toDate().toISOString(),
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
    };
  },
};
