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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const docRef = await addDoc(
      collection(db, TRIPS_COLLECTION),
      validatedData
    );
    return docRef.id;
  },

  async updateTrip(id: string, data: Partial<BusinessTrip>): Promise<void> {
    const docRef = doc(db, TRIPS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
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

  async getTripById(id: string): Promise<BusinessTrip | null> {
    const docRef = doc(db, TRIPS_COLLECTION, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as BusinessTrip;
  },

  async deleteTrip(id: string): Promise<void> {
    // В реално приложение тук трябва да изтрием и разходите към командировката
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
