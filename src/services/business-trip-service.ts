import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

import { db, storage } from "@/lib/firebase";
import {
  BusinessTrip,
  BusinessTripSchema,
  TripExpense,
  TripExpenseSchema,
} from "@/types/business-trip.types";

const TRIPS_COLLECTION = "business_trips";
const EXPENSES_COLLECTION = "trip_expenses";

export const businessTripService = {
  // ---------------------------------------------
  // TRIPS
  // ---------------------------------------------

  async createTrip(data: Omit<BusinessTrip, "id">): Promise<string> {
    const validatedData = BusinessTripSchema.omit({ id: true }).parse({
      ...data,
      // Официална дата на заповедта: ако потребителят я е определил ръчно, използваме нея; иначе вземаме сегашната
      orderDate: data.orderDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Firebase не приема undefined стойности, затова ги изчистваме
    const sanitizedData = JSON.parse(JSON.stringify(validatedData));

    const docRef = await addDoc(
      collection(db, TRIPS_COLLECTION),
      sanitizedData
    );
    return docRef.id;
  },

  async updateTrip(id: string, data: Partial<BusinessTrip>): Promise<void> {
    const docRef = doc(db, TRIPS_COLLECTION, id);

    // Firebase не приема undefined стойности, затова ги изчистваме
    const sanitizedData = JSON.parse(JSON.stringify(data));

    await updateDoc(docRef, {
      ...sanitizedData,
      updatedAt: new Date().toISOString(),
    });
  },

  async getTrips(siteId: string): Promise<BusinessTrip[]> {
    const q = query(
      collection(db, TRIPS_COLLECTION),
      where("siteId", "==", siteId),
      orderBy("startDate", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BusinessTrip[];
  },

  async getTripsByEventId(
    eventId: string,
    siteId: string = "bkgalabovo"
  ): Promise<BusinessTrip[]> {
    const q = query(
      collection(db, TRIPS_COLLECTION),
      where("siteId", "==", siteId),
      where("eventId", "==", eventId)
    );

    const snapshot = await getDocs(q);
    // Fetch and sort locally since we don't have a composite index for eventId + startDate yet
    const trips = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BusinessTrip[];

    return trips.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  },

  async getTripById(id: string): Promise<BusinessTrip | null> {
    const docRef = doc(db, TRIPS_COLLECTION, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as BusinessTrip;
  },

  async deleteTrip(id: string): Promise<void> {
    // 0. Извличаме командировката първо, за да вземем нейния siteId.
    // Това е нужно, защото Firestore Security Rules (Rules are not filters)
    // изискват заявката към trip_expenses да включва siteId, за да разрешат list(getDocs).
    const trip = await this.getTripById(id);
    if (!trip) return;

    // 1. Изтриваме всички разходи, свързани с командировката
    const expensesQuery = query(
      collection(db, EXPENSES_COLLECTION),
      where("tripId", "==", id),
      where("siteId", "==", trip.siteId) // Ключово за преминаване през Security Rules!
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    const deleteExpensesPromises = expensesSnapshot.docs.map((expDoc) =>
      deleteDoc(doc(db, EXPENSES_COLLECTION, expDoc.id))
    );
    await Promise.all(deleteExpensesPromises);

    // 2. Изтриваме самата командировка
    await deleteDoc(doc(db, TRIPS_COLLECTION, id));
  },

  // ---------------------------------------------
  // EXPENSES
  // ---------------------------------------------

  async addExpense(data: Omit<TripExpense, "id">): Promise<string> {
    const validatedData = TripExpenseSchema.omit({ id: true }).parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const docRef = await addDoc(
      collection(db, EXPENSES_COLLECTION),
      validatedData
    );
    return docRef.id;
  },

  async getExpensesByTrip(tripId: string): Promise<TripExpense[]> {
    const q = query(
      collection(db, EXPENSES_COLLECTION),
      where("tripId", "==", tripId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TripExpense[];
  },

  async deleteExpense(id: string): Promise<void> {
    await deleteDoc(doc(db, EXPENSES_COLLECTION, id));
  },

  async updateExpense(id: string, data: Partial<TripExpense>): Promise<void> {
    const validatedData = TripExpenseSchema.partial().parse(data);
    await updateDoc(doc(db, EXPENSES_COLLECTION, id), {
      ...validatedData,
      updatedAt: new Date().toISOString(),
    });
  },

  // ---------------------------------------------
  // ATTACHMENTS (Storage)
  // ---------------------------------------------

  async uploadExpenseDocument(
    siteId: string,
    tripId: string,
    file: File
  ): Promise<string> {
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Път: sites/{siteId}/business-trips/{tripId}/{fileName}
    const storageRef = ref(
      storage,
      `sites/${siteId}/business-trips/${tripId}/${fileName}`
    );

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  },
};
