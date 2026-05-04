import { collection, FirestoreDataConverter } from "firebase/firestore";
import { getDb } from "./firebase";
export { getDb };
import {
  ClubService,
  ClubGeneralService,
  InventoryEvent,
  Member,
  Product,
  Sale,
  Subscription,
} from "@/types";

const memberConverter: FirestoreDataConverter<Member> = {
  toFirestore: (member) => {
    const { ...data } = member;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as Member;
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
      ...data,
    } as Sale;
  },
};

const clubServiceConverter: FirestoreDataConverter<ClubService> = {
  toFirestore: (service) => {
    const { ...data } = service;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as ClubService;
  },
};

const subscriptionConverter: FirestoreDataConverter<Subscription> = {
  toFirestore: (subscription) => {
    const { ...data } = subscription;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as Subscription;
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
      ...data,
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
      ...data,
    } as InventoryEvent;
  },
};

const clubGeneralServiceConverter: FirestoreDataConverter<ClubGeneralService> = {
  toFirestore: (service) => {
    const { ...data } = service;
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as ClubGeneralService;
  },
};

// --- Collection Getters ---

export const getMembersCollection = () =>
  collection(getDb(), "members").withConverter(memberConverter);

export const getSalesCollection = () =>
  collection(getDb(), "sales").withConverter(saleConverter);

export const getClubServicesCollection = () =>
  collection(getDb(), "clubServices").withConverter(clubServiceConverter);

export const getMemberSubscriptionsCollection = () =>
  collection(getDb(), "memberSubscriptions").withConverter(
    subscriptionConverter
  );

export const getProductsCollection = () =>
  collection(getDb(), "products").withConverter(productConverter);

export const getInventoryEventsCollection = () =>
  collection(getDb(), "inventory-events").withConverter(
    inventoryEventConverter
  );

export const getClubGeneralServicesCollection = () =>
  collection(getDb(), "clubGeneralServices").withConverter(
    clubGeneralServiceConverter
  );
