import { collection, addDoc, doc, updateDoc, getDocs, query, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Reservation, BlockedSlot } from '@/types/reservation';

const db = getDb();
const reservationsCollection = collection(db, 'reservations');
const blockedSlotsCollection = collection(db, 'blockedSlots');

// --- Helper Functions --- //

const getDayBoundaries = (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay: Timestamp.fromDate(startOfDay), endOfDay: Timestamp.fromDate(endOfDay) };
};

const checkForConflicts = async (startTime: Timestamp, endTime: Timestamp, courtIds: number[], excludeId?: string): Promise<boolean> => {
    // 1. Check for conflicting reservations
    const reservationQuery = query(
        reservationsCollection,
        where('startTime', '<', endTime)
    );
    const conflictingReservations = await getDocs(reservationQuery);
    for (const doc of conflictingReservations.docs) {
        if (doc.id !== excludeId) {
            const reservation = doc.data();
            if (courtIds.includes(reservation.courtId) && reservation.endTime > startTime) {
                console.error('Conflict with reservation:', doc.data());
                return true; // Conflict found
            }
        }
    }

    // 2. Check for conflicting blocked slots
    const blockedSlotQuery = query(
        blockedSlotsCollection,
        where('startTime', '<', endTime)
    );
    const conflictingSlots = await getDocs(blockedSlotQuery);
    for (const doc of conflictingSlots.docs) {
        if (doc.id === excludeId) continue; // Don't check against self

        const slot = doc.data() as BlockedSlot;
        if (slot.endTime > startTime) { // Check for overlap in memory
            const isBlockedForAll = slot.courtIds.length === 0;
            const overlapsWithCourt = courtIds.some(id => slot.courtIds.includes(id));

            if (isBlockedForAll || overlapsWithCourt) {
                console.error('Conflict with blocked slot:', slot);
                return true; // Conflict found
            }
        }
    }

    return false; // No conflicts
};

const sendConfirmationEmail = async (reservationId: string, data: Omit<Reservation, 'id' | 'createdAt'>) => {
    if (!data.clientEmail) {
        console.log(`[Email] No email provided for reservation ${reservationId}. Skipping email.`);
        return;
    }

    try {
        console.log(`[Email] Attempting to send confirmation for reservation ${reservationId} to ${data.clientEmail}`);
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: data.clientEmail,
                subject: 'Потвърждение на резервация - Бадминтон Клуб Гълъбово',
                template: 'reservationConfirmation',
                data: {
                    clientName: data.clientName,
                    startTime: data.startTime.toDate(), // Serialize date
                    endTime: data.endTime.toDate(),   // Serialize date
                    courtId: data.courtId,
                    reservationId: reservationId,
                },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Failed to send email: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
        }

        console.log(`[Email] Successfully sent confirmation for reservation ${reservationId}`);

    } catch (error) {
        // IMPORTANT: We only log the error. We don't re-throw it because the reservation itself was successful.
        console.error(`[Email] CRITICAL: Failed to send confirmation email for reservation ${reservationId}. The reservation IS saved.`, error);
    }
}


// --- Public API --- //

export const createReservation = async (reservationData: Omit<Reservation, 'id' | 'createdAt'>) => {
  const hasConflict = await checkForConflicts(reservationData.startTime, reservationData.endTime, [reservationData.courtId]);
  if (hasConflict) {
    throw new Error("Избраният период се застъпва със съществуваща резервация или блокиран час.");
  }
  
  const docRef = await addDoc(reservationsCollection, { ...reservationData, createdAt: Timestamp.now() });
  
  // After successful creation, try to send an email but don't block the process if it fails
  await sendConfirmationEmail(docRef.id, reservationData);

  return docRef.id;
};

export const updateReservation = async (id: string, data: Omit<Reservation, 'id' | 'createdAt' | 'status'>) => {
    const hasConflict = await checkForConflicts(data.startTime, data.endTime, [data.courtId], id);
    if (hasConflict) {
        throw new Error("Промяната се застъпва със съществуваща резервация или блокиран час.");
    }
    const docRef = doc(db, 'reservations', id);
    await updateDoc(docRef, data);
};

export const getReservationsForDay = async (date: Date): Promise<Reservation[]> => {
    const { startOfDay, endOfDay } = getDayBoundaries(date);
    const q = query(reservationsCollection, where('startTime', '>=', startOfDay), where('startTime', '<', endOfDay));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Reservation, 'id'>) }));
};

const updateReservationStatus = async (reservationId: string, status: Reservation['status']) => {
  const docRef = doc(db, 'reservations', reservationId);
  await updateDoc(docRef, { status });
};

export const deleteReservation = async (reservationId: string) => {
    const docRef = doc(db, 'reservations', reservationId);
    await deleteDoc(docRef);
};

export const createBlockedSlot = async (slotData: Omit<BlockedSlot, 'id' | 'createdAt'>) => {
    const courtIdsToCheck = slotData.courtIds.length > 0 ? slotData.courtIds : [1, 2, 3, 4, 5, 6];
    const hasConflict = await checkForConflicts(slotData.startTime, slotData.endTime, courtIdsToCheck);
    if (hasConflict) {
        throw new Error("Избраният период се застъпва със съществуваща резервация.");
    }
    const docRef = await addDoc(blockedSlotsCollection, { ...slotData, createdAt: Timestamp.now() });
    return docRef.id;
};

export const updateBlockedSlot = async (id: string, data: Omit<BlockedSlot, 'id' | 'createdAt'>) => {
    const courtIdsToCheck = data.courtIds.length > 0 ? data.courtIds : [1, 2, 3, 4, 5, 6];
    const hasConflict = await checkForConflicts(data.startTime, data.endTime, courtIdsToCheck, id);
    if (hasConflict) {
        throw new Error("Промяната се застъпва със съществуваща резервация или блокиран час.");
    }
    const docRef = doc(db, 'blockedSlots', id);
    await updateDoc(docRef, data);
};

export const getBlockedSlotsForDay = async (date: Date): Promise<BlockedSlot[]> => {
    const { startOfDay, endOfDay } = getDayBoundaries(date);
    const q = query(blockedSlotsCollection, where('startTime', '>=', startOfDay), where('startTime', '<', endOfDay));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<BlockedSlot, 'id'>) }));
};

export const deleteBlockedSlot = async (slotId: string) => {
    const docRef = doc(db, 'blockedSlots', slotId);
    await deleteDoc(docRef);
};
