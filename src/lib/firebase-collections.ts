import {
  collection,
  FirestoreDataConverter,
  query,
  where,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { getSiteConfig } from "@/config/sites";
import {
  ClubService,
  InventoryEvent,
  Member,
  Product,
  Sale,
  Subscription,
} from "@/types";

const memberConverter: FirestoreDataConverter<Member> = {
  toFirestore: (member) => {
    const { ...data } = member;
    return { ...data, siteId: getSiteConfig().id };
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
    return { ...data, siteId: getSiteConfig().id };
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
    return { ...data, siteId: getSiteConfig().id };
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
    return { ...data, siteId: getSiteConfig().id };
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
    return { ...data, siteId: getSiteConfig().id };
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
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as InventoryEvent;
  },
};

// --- Collection Getters (Raw) ---

export const getMembersCollection = () =>
  collection(getDb(), "members").withConverter(memberConverter);

export const getSalesCollection = () =>
  collection(getDb(), "sales").withConverter(saleConverter);

export const getClubServicesCollection = () =>
  collection(getDb(), "club-services").withConverter(clubServiceConverter);

export const getMemberSubscriptionsCollection = () =>
  collection(getDb(), "member-subscriptions").withConverter(
    subscriptionConverter
  );

export const getProductsCollection = () =>
  collection(getDb(), "products").withConverter(productConverter);

export const getInventoryEventsCollection = () =>
  collection(getDb(), "inventory-events").withConverter(
    inventoryEventConverter
  );

// --- Tenant-Aware Query Getters ---

export const getMembersQuery = () =>
  query(getMembersCollection(), where("siteId", "==", getSiteConfig().id));

export const getSalesQuery = () =>
  query(getSalesCollection(), where("siteId", "==", getSiteConfig().id));

export const getClubServicesQuery = () =>
  query(getClubServicesCollection(), where("siteId", "==", getSiteConfig().id));

export const getSubscriptionsQuery = () =>
  query(
    getMemberSubscriptionsCollection(),
    where("siteId", "==", getSiteConfig().id)
  );

export const getProductsQuery = () =>
  query(getProductsCollection(), where("siteId", "==", getSiteConfig().id));

export const getInventoryEventsQuery = () =>
  query(
    getInventoryEventsCollection(),
    where("siteId", "==", getSiteConfig().id)
  );
