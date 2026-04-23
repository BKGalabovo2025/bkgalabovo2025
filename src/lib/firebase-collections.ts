import { collection, FirestoreDataConverter } from "firebase/firestore";
import { getDb } from "./firebase"; // Changed to use getDb
import { Tournament } from "@/types/tournament.types";
import { Member } from "@/types/member.types";
import { Family } from "@/types/family.types";
import { Reminder } from "@/types/reminder.types";
import { Sale } from "@/types/sales.types";
import { Service } from "@/app/(protected)/finances/services/service.types";
import { MemberSubscription } from "@/types/member-subscription.types";
import { Product } from "@/types/product.types";
import { InventoryEvent } from "@/types/inventory-event.types";

// --- Converters (no changes) ---

const tournamentConverter: FirestoreDataConverter<Tournament> = {
  toFirestore: (tournament) => {
    const { ...data } = tournament;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      location: data.location,
      registrationDeadline: data.registrationDeadline.toDate(),
      ageGroups: data.ageGroups,
      status: data.status
    } as Tournament;
  },
};

const memberConverter: FirestoreDataConverter<Member> = {
  toFirestore: (member) => {
    const { ...data } = member;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as Member;
  },
};

const familyConverter: FirestoreDataConverter<Family> = {
  toFirestore: (family) => {
    const { ...data } = family;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as Family;
  },
};

const reminderConverter: FirestoreDataConverter<Reminder> = {
  toFirestore: (reminder) => {
    const { ...data } = reminder;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as Reminder;
  },
};

const saleConverter: FirestoreDataConverter<Sale> = {
  toFirestore: (sale) => {
    const { ...data } = sale;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as Sale;
  },
};

const serviceConverter: FirestoreDataConverter<Service> = {
    toFirestore: (service) => {
        const { ...data } = service;
        return data;
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data
        } as Service;
    },
};

const memberSubscriptionConverter: FirestoreDataConverter<MemberSubscription> = {
  toFirestore: (subscription) => {
    const { ...data } = subscription;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as MemberSubscription;
  },
};

const productConverter: FirestoreDataConverter<Product> = {
  toFirestore: (product) => {
    const { ...data } = product;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as Product;
  },
};

const inventoryEventConverter: FirestoreDataConverter<InventoryEvent> = {
  toFirestore: (event) => {
    const { ...data } = event;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data
    } as InventoryEvent;
  },
};


// --- Collection Getters ---

export const getTournamentsCollection = () => collection(getDb(), "tournaments").withConverter(tournamentConverter);
export const getMembersCollection = () => collection(getDb(), "members").withConverter(memberConverter);
export const getFamiliesCollection = () => collection(getDb(), "families").withConverter(familyConverter);
export const getRemindersCollection = () => collection(getDb(), "reminders").withConverter(reminderConverter);
export const getSalesCollection = () => collection(getDb(), "sales").withConverter(saleConverter);
export const getClubServicesCollection = () => collection(getDb(), "club-services").withConverter(serviceConverter);
export const getMemberSubscriptionsCollection = () => collection(getDb(), "member-subscriptions").withConverter(memberSubscriptionConverter);
export const getProductsCollection = () => collection(getDb(), "products").withConverter(productConverter);
export const getInventoryEventsCollection = () => collection(getDb(), "inventory-events").withConverter(inventoryEventConverter);
