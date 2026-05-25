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
  Price,
  PriceHistory,
  ScheduleEvent,
  ClientPackage,
  GeneralService,
  Reservation,
  BlockedSlot,
} from "@/types";
import { Tournament, TournamentEntry, Match } from "@/types/tournament.types";

const memberConverter: FirestoreDataConverter<Member> = {
  toFirestore: (member) => {
    const { ...data } = member;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as Member;
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
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as Sale;
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
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as ClubService;
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
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as Product;
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
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as InventoryEvent;
  },
};

const tournamentConverter: FirestoreDataConverter<Tournament> = {
  toFirestore: (tournament) => {
    const { ...data } = tournament;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as Tournament;
  },
};

const entryConverter: FirestoreDataConverter<TournamentEntry> = {
  toFirestore: (entry) => {
    const { ...data } = entry;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as TournamentEntry;
  },
};

const matchConverter: FirestoreDataConverter<Match> = {
  toFirestore: (match) => {
    const { ...data } = match;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as Match;
  },
};

const generalServiceConverter: FirestoreDataConverter<GeneralService> = {
  toFirestore: (service) => {
    const { ...data } = service;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as GeneralService;
  },
};

const priceConverter: FirestoreDataConverter<Price> = {
  toFirestore: (price) => {
    const { ...data } = price;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as Price;
  },
};

export interface RecoverySession {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: number;
  durationMinutes: number;
  category: string;
  benefits: string[];
  zones: string[];
  athleteCount: number;
  numberOfDays: number;
  proceduresPerDay: number;
  sessionType: string;
  imageUrl?: string;
  imageHint?: string;
  isActive: boolean;
  siteId: string;
}

const sessionConverter: FirestoreDataConverter<RecoverySession> = {
  toFirestore: (session) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = session;
    return { 
      ...data, 
      durationMinutes: session.durationMinutes || session.duration || 30,
      siteId: "recoveryzone" 
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);

    // Handle 'zones' being either a string or an array
    let zones: string[] = [];
    if (Array.isArray(data.zones)) {
      zones = data.zones;
    } else if (typeof data.zones === "string") {
      zones = data.zones.split(",").map((s) => s.trim());
    }

    return {
      id: snapshot.id,
      ...data,
      zones,
      durationMinutes: data.durationMinutes || data.duration || 30,
    } as RecoverySession;
  },
};

const priceHistoryConverter: FirestoreDataConverter<PriceHistory> = {
  toFirestore: (history) => {
    const { ...data } = history;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as PriceHistory;
  },
};

const eventConverter: FirestoreDataConverter<ScheduleEvent> = {
  toFirestore: (event) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = event;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as ScheduleEvent;
  },
};

const clientPackageConverter: FirestoreDataConverter<ClientPackage> = {
  toFirestore: (pkg) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = pkg;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "recoveryzone",
      ...data,
    } as unknown as ClientPackage;
  },
};

const reservationConverter: FirestoreDataConverter<Reservation> = {
  toFirestore: (res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = res;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as Reservation;
  },
};

const blockedSlotConverter: FirestoreDataConverter<BlockedSlot> = {
  toFirestore: (slot) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = slot;
    return { ...data, siteId: getSiteConfig().id };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      siteId: data.siteId || "bkgalabovo",
      ...data,
    } as unknown as BlockedSlot;
  },
};

// --- Collection Getters (Raw) ---

export const getMembersCollection = () =>
  collection(getDb(), "members").withConverter(memberConverter);

export const getSalesCollection = () =>
  collection(getDb(), "sales").withConverter(saleConverter);

export const getClubServicesCollection = () =>
  collection(getDb(), "clubServices").withConverter(clubServiceConverter);


export const getProductsCollection = () =>
  collection(getDb(), "products").withConverter(productConverter);

export const getTournamentCollection = () =>
  collection(getDb(), "tournaments").withConverter(tournamentConverter);

export const getTournamentEntriesCollection = () =>
  collection(getDb(), "tournament_entries").withConverter(entryConverter);

export const getTournamentMatchesCollection = () =>
  collection(getDb(), "tournament_matches").withConverter(matchConverter);

export const getInventoryEventsCollection = () =>
  collection(getDb(), "inventoryEvents").withConverter(inventoryEventConverter);

export const getEventsCollection = () =>
  collection(getDb(), "events").withConverter(eventConverter);

export const getTournamentsCollection = () =>
  collection(getDb(), "tournaments").withConverter(tournamentConverter);

export const getClientPackagesCollection = () =>
  collection(getDb(), "client_packages").withConverter(clientPackageConverter);

export const getGeneralServicesCollection = () =>
  collection(getDb(), "clubGeneralServices").withConverter(
    generalServiceConverter
  );

export const getReservationsCollection = () =>
  collection(getDb(), "reservations").withConverter(reservationConverter);

export const getBlockedSlotsCollection = () =>
  collection(getDb(), "blockedSlots").withConverter(blockedSlotConverter);

// --- Tenant-Aware Query Getters ---

export const getMembersQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo") return query(getMembersCollection());
  return query(getMembersCollection(), where("siteId", "==", siteConfig.id));
};

export const getSalesQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo") return query(getSalesCollection());
  return query(getSalesCollection(), where("siteId", "==", siteConfig.id));
};

export const getClubServicesQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo") return query(getClubServicesCollection());
  return query(
    getClubServicesCollection(),
    where("siteId", "==", siteConfig.id)
  );
};


export const getProductsQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo") return query(getProductsCollection());
  return query(getProductsCollection(), where("siteId", "==", siteConfig.id));
};

export const getInventoryEventsQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo")
    return query(getInventoryEventsCollection());
  return query(
    getInventoryEventsCollection(),
    where("siteId", "==", siteConfig.id)
  );
};

export const getEventsQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo") return query(getEventsCollection());
  return query(getEventsCollection(), where("siteId", "==", siteConfig.id));
};

export const getTournamentsQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo") return query(getTournamentsCollection());
  return query(
    getTournamentsCollection(),
    where("siteId", "==", siteConfig.id)
  );
};

export const getTournamentEntriesQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo")
    return query(getTournamentEntriesCollection());
  return query(
    getTournamentEntriesCollection(),
    where("siteId", "==", siteConfig.id)
  );
};

export const getTournamentMatchesQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo")
    return query(getTournamentMatchesCollection());
  return query(
    getTournamentMatchesCollection(),
    where("siteId", "==", siteConfig.id)
  );
};

// Pricing Collections
export const getPricesCollection = () =>
  collection(getDb(), "prices").withConverter(priceConverter);

export const getPricesQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo") return query(getPricesCollection());
  return query(getPricesCollection(), where("siteId", "==", siteConfig.id));
};

export const getPriceHistoryCollection = () =>
  collection(getDb(), "priceHistory").withConverter(priceHistoryConverter);

export const getPriceHistoryQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo") return query(getPriceHistoryCollection());
  return query(
    getPriceHistoryCollection(),
    where("siteId", "==", siteConfig.id)
  );
};

// Recovery Zone Sessions
export const getSessionsCollection = () =>
  collection(getDb(), "sessions").withConverter(sessionConverter);

export const getSessionsQuery = () => {
  return query(getSessionsCollection(), where("siteId", "==", "recoveryzone"));
};

export const getClientPackagesQuery = (memberId?: string) => {
  const siteConfig = getSiteConfig();
  let q = query(getClientPackagesCollection());

  if (siteConfig.id !== "bkgalabovo") {
    q = query(q, where("siteId", "==", siteConfig.id));
  }

  if (memberId) {
    q = query(q, where("memberId", "==", memberId));
  }

  return q;
};

export const getGeneralServicesQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo")
    return query(getGeneralServicesCollection());
  return query(
    getGeneralServicesCollection(),
    where("siteId", "==", siteConfig.id)
  );
};

export const getReservationsQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo") return query(getReservationsCollection());
  return query(
    getReservationsCollection(),
    where("siteId", "==", siteConfig.id)
  );
};

export const getBlockedSlotsQuery = () => {
  const siteConfig = getSiteConfig();
  if (siteConfig.id === "bkgalabovo") return query(getBlockedSlotsCollection());
  return query(
    getBlockedSlotsCollection(),
    where("siteId", "==", siteConfig.id)
  );
};
