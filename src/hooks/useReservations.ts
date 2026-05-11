import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Reservation, ReservationStatus } from "@/types/booking.types";
import { reservationConverter } from "@/services/booking/converters";
import { toast } from "sonner";

export const useReservations = (siteId?: string, date?: Date) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!siteId) {
      setIsLoading(false);
      return;
    }

    const db = getDb();
    const reservationsRef = collection(db, "reservations").withConverter(reservationConverter);
    
    let q = query(reservationsRef, where("siteId", "==", siteId));

    if (date) {
      // Filter for the specific day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      q = query(
        reservationsRef,
        where("siteId", "==", siteId),
        where("startTime", ">=", Timestamp.fromDate(startOfDay)),
        where("startTime", "<=", Timestamp.fromDate(endOfDay)),
        orderBy("startTime", "asc")
      );
    } else {
      q = query(q, orderBy("startTime", "desc"));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data());
        setReservations(data);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching reservations:", err);
        setError(err);
        setIsLoading(false);
        toast.error("Грешка при зареждане на резервациите");
      }
    );

    return () => unsubscribe();
  }, [siteId, date?.toDateString()]);

  const addReservation = useCallback(async (reservation: Omit<Reservation, "id" | "createdAt" | "updatedAt">) => {
    const db = getDb();
    try {
      const docRef = await addDoc(collection(db, "reservations").withConverter(reservationConverter), {
        ...reservation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Reservation);
      return docRef.id;
    } catch (err) {
      console.error("Error adding reservation:", err);
      toast.error("Грешка при създаване на резервация");
      throw err;
    }
  }, []);

  const updateReservationStatus = useCallback(async (id: string, status: ReservationStatus) => {
    const db = getDb();
    try {
      const docRef = doc(db, "reservations", id);
      await updateDoc(docRef, { status, updatedAt: Timestamp.now() });
      toast.success("Статусът е обновен");
    } catch (err) {
      console.error("Error updating reservation:", err);
      toast.error("Грешка при обновяване на статуса");
      throw err;
    }
  }, []);

  const cancelReservation = useCallback(async (id: string) => {
    return updateReservationStatus(id, "cancelled");
  }, [updateReservationStatus]);

  return {
    reservations,
    isLoading,
    error,
    addReservation,
    updateReservationStatus,
    cancelReservation,
  };
};
