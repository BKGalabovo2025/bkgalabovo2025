import {
  collection,
  CollectionReference,
  DocumentData,
  FirestoreDataConverter,
  orderBy,
  Query,
  query,
  where,
} from "firebase/firestore";

import { getSiteConfig } from "@/config/sites";
import {
  BlockedSlot,
  ClientPackage,
  ClubService,
  GeneralService,
  InventoryEvent,
  Member,
  Price,
  PriceHistory,
  Product,
  Reservation,
  Sale,
  ScheduleEvent,
} from "@/types";
import { SignedDeclaration } from "@/types";
import { MemberAssessment } from "@/types/assessment.types";
import { Match, Tournament, TournamentEntry } from "@/types/tournament.types";

import { getDb } from "./firebase";

function createConverter<T>(
  defaultSiteId: string = "bkgalabovo"
): FirestoreDataConverter<T> {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toFirestore: (item: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...data } = item;
      return { ...data, siteId: getSiteConfig().id };
    },
    fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);
      return {
        id: snapshot.id,
        siteId: data.siteId || defaultSiteId,
        ...data,
      } as unknown as T;
    },
  };
}

const memberConverter = createConverter<Member>();

const saleConverter = createConverter<Sale>();

const clubServiceConverter = createConverter<ClubService>();

const productConverter = createConverter<Product>();

const inventoryEventConverter = createConverter<InventoryEvent>();

const tournamentConverter = createConverter<Tournament>();

const entryConverter = createConverter<TournamentEntry>();

const matchConverter = createConverter<Match>();

const generalServiceConverter = createConverter<GeneralService>();

const memberAssessmentConverter = createConverter<MemberAssessment>();

const priceConverter = createConverter<Price>();

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
  imageDisplayMode?: "collage" | "carousel";
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
      siteId: "recoveryzone",
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

const priceHistoryConverter = createConverter<PriceHistory>();

const eventConverter = createConverter<ScheduleEvent>();

const clientPackageConverter = createConverter<ClientPackage>("recoveryzone");

const reservationConverter = createConverter<Reservation>();

const blockedSlotConverter = createConverter<BlockedSlot>();

const signedDeclarationConverter = createConverter<SignedDeclaration>();

// --- Collection Getters (Raw) ---

export const getMembersCollection = () =>
  collection(getDb(), "members").withConverter(memberConverter);

export const getSalesCollection = () =>
  collection(getDb(), "sales").withConverter(saleConverter);

export const getClubServicesCollection = () =>
  collection(getDb(), "clubServices").withConverter(clubServiceConverter);

const getProductsCollection = () =>
  collection(getDb(), "products").withConverter(productConverter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getTournamentCollection = () =>
  collection(getDb(), "tournaments").withConverter(tournamentConverter);

export const getTournamentEntriesCollection = () =>
  collection(getDb(), "tournament_entries").withConverter(entryConverter);

export const getTournamentMatchesCollection = () =>
  collection(getDb(), "tournament_matches").withConverter(matchConverter);

const getInventoryEventsCollection = () =>
  collection(getDb(), "inventoryEvents").withConverter(inventoryEventConverter);

export const getEventsCollection = () =>
  collection(getDb(), "events").withConverter(eventConverter);

export const getTournamentsCollection = () =>
  collection(getDb(), "tournaments").withConverter(tournamentConverter);

const getClientPackagesCollection = () =>
  collection(getDb(), "client_packages").withConverter(clientPackageConverter);

const getGeneralServicesCollection = () =>
  collection(getDb(), "clubGeneralServices").withConverter(
    generalServiceConverter
  );

const getReservationsCollection = () =>
  collection(getDb(), "reservations").withConverter(reservationConverter);

const getBlockedSlotsCollection = () =>
  collection(getDb(), "blockedSlots").withConverter(blockedSlotConverter);

const getSignedDeclarationsCollection = () =>
  collection(getDb(), "member_declarations").withConverter(
    signedDeclarationConverter
  );

// --- Tenant-Aware Query Getters ---

function createSiteQuery<T, D extends DocumentData>(
  collectionRef: CollectionReference<T, D>,
  defaultSiteId?: string
): Query<T, D> {
  return query(
    collectionRef,
    where("siteId", "==", defaultSiteId || getSiteConfig().id)
  );
}

export const getMembersQuery = () => createSiteQuery(getMembersCollection());

export const getSalesQuery = () => createSiteQuery(getSalesCollection());

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getClubServicesQuery = () => createSiteQuery(getClubServicesCollection());

export const getProductsQuery = () => createSiteQuery(getProductsCollection());

export const getInventoryEventsQuery = () =>
  createSiteQuery(getInventoryEventsCollection());

export const getEventsQuery = () => createSiteQuery(getEventsCollection());

/** Returns only events for today (midnight to 23:59:59).
 *  Used for the priority (fast) load in useEvents. */
export const getTodayEventsQuery = () => {
  const siteConfig = getSiteConfig();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const startStr = startOfToday.toISOString();
  const endStr = endOfToday.toISOString();

  return query(
    getEventsCollection(),
    where("siteId", "==", siteConfig.id),
    where("startDate", ">=", startStr),
    where("startDate", "<=", endStr),
    orderBy("startDate", "asc")
  );
};

export const getUpcomingEventsQuery = () => {
  const siteConfig = getSiteConfig();
  const startOfTomorrow = new Date();
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  startOfTomorrow.setHours(0, 0, 0, 0);

  const startStr = startOfTomorrow.toISOString();

  return query(
    getEventsCollection(),
    where("siteId", "==", siteConfig.id),
    where("startDate", ">=", startStr),
    orderBy("startDate", "asc")
  );
};

export const getPastEventsQuery = () => {
  const siteConfig = getSiteConfig();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startStr = startOfToday.toISOString();

  return query(
    getEventsCollection(),
    where("siteId", "==", siteConfig.id),
    where("startDate", "<", startStr),
    orderBy("startDate", "desc")
  );
};

export const getTournamentsQuery = () =>
  createSiteQuery(getTournamentsCollection());

export const getTournamentEntriesQuery = () =>
  createSiteQuery(getTournamentEntriesCollection());

export const getTournamentMatchesQuery = () =>
  createSiteQuery(getTournamentMatchesCollection());

// Pricing Collections
export const getPricesCollection = () =>
  collection(getDb(), "prices").withConverter(priceConverter);

export const getPricesQuery = () => createSiteQuery(getPricesCollection());

export const getPriceHistoryCollection = () =>
  collection(getDb(), "priceHistory").withConverter(priceHistoryConverter);

export const getPriceHistoryQuery = () =>
  createSiteQuery(getPriceHistoryCollection());

// Recovery Zone Sessions
const getSessionsCollection = () =>
  collection(getDb(), "sessions").withConverter(sessionConverter);

export const getSessionsQuery = () => {
  return query(getSessionsCollection(), where("siteId", "==", "recoveryzone"));
};

export const getClientPackagesQuery = (memberId?: string) => {
  const siteConfig = getSiteConfig();
  let q = query(
    getClientPackagesCollection(),
    where("siteId", "==", siteConfig.id)
  );

  if (memberId) {
    q = query(q, where("memberId", "==", memberId));
  }

  return q;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getGeneralServicesQuery = () =>
  createSiteQuery(getGeneralServicesCollection());

// ================= MEMBER ASSESSMENTS =================
export const getMemberAssessmentsCollection = () =>
  collection(getDb(), "member_assessments").withConverter(
    memberAssessmentConverter
  );

export const getMemberAssessmentsQuery = () =>
  createSiteQuery(getMemberAssessmentsCollection());

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getReservationsQuery = () => createSiteQuery(getReservationsCollection());

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getBlockedSlotsQuery = () => createSiteQuery(getBlockedSlotsCollection());

export const getSignedDeclarationsQuery = (memberId?: string) => {
  let q = query(getSignedDeclarationsCollection());
  if (memberId) {
    q = query(q, where("memberId", "==", memberId));
  }
  return q;
};
