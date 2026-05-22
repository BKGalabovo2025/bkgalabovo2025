import {
  getDocs,
  doc,
  getDoc,
  Timestamp,
  query,
  serverTimestamp,
  DocumentSnapshot,
  limit,
  orderBy,
  deleteDoc,
  CollectionReference,
  startAfter,
  addDoc,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
import {
  getMembersCollection,
  getMembersQuery,
  getMemberSubscriptionsCollection,
  getSalesCollection,
} from "@/lib/firebase-collections";
import { deleteFile } from "./storage-service";
import { validateMemberData } from "@/lib/validators";
import logger from "@/lib/logger";
import { getSiteConfig } from "@/config/sites";
import { Member, MemberSchema } from "@/types/member.types";

// Converts a Firestore document to a Member object with robust validation.
export const docToMember = (docSnap: DocumentSnapshot): Member | null => {
  if (!docSnap.exists()) {
    console.warn(`docToMember: Document with ID ${docSnap.id} does not exist.`);
    return null;
  }

  const data = docSnap.data();

  // Helper to gracefully convert Timestamps to ISO strings.
  const toISODate = (
    date: { toDate?: () => Date } | Date | string | null | undefined
  ): string | undefined => {
    if (!date) return undefined;
    // Duck-typing check for Firestore Timestamp
    if (typeof (date as { toDate?: () => Date }).toDate === "function") {
      return (date as { toDate: () => Date }).toDate().toISOString();
    }
    if (date instanceof Date) {
      return date.toISOString();
    }
    return date as string;
  };

  const name = [data.firstName, data.middleName, data.lastName]
    .filter(Boolean)
    .join(" ");

  // Prepare the data for Zod parsing, ensuring derived/converted fields overwrite spread data.
  const dataToParse = {
    ...data,
    id: docSnap.id,
    name: name,
    dateOfBirth: toISODate(data.dateOfBirth),
    registrationDate:
      toISODate(data.registrationDate) || new Date().toISOString(),
    updatedAt: toISODate(data.updatedAt),
    skillLevel: data.skillLevel || null,
  };

  try {
    // Use Zod to validate and parse the data.
    return MemberSchema.parse(dataToParse);
  } catch (error) {
    // Use structured logger if available
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const logger = require("@/lib/logger").default;
      logger.error(`Validation failed for ID ${docSnap.id}.`, { data: dataToParse, error });
    } catch (e) {
      console.error(`Validation failed for ID ${docSnap.id}. Data:`, dataToParse, error);
    }
    return null;
  }
};

// Fetches a single member by their ID.
export const getMemberById = async (id: string): Promise<Member | null> => {
  if (!id || id === "undefined") {
    console.error(`getMemberById was called with an invalid ID: ${id}`);
    return null;
  }
  const memberRef = doc(getMembersCollection(), id);
  const docSnap = await getDoc(memberRef);
  return docToMember(docSnap);
};

// Removed in-memory caching for serverless reliability. Use `getMembersPage` for pagination.

// Fetches all members from the database with a simple in-memory cache.
export const getAllMembers = async (): Promise<Member[]> => {
  // For scalability use paginated queries (`getMembersPage`) in the client.
  // Here we return the first page with a high limit; callers should prefer `getMembersPage`.
  const q = query(getMembersQuery(), orderBy("lastName", "asc"), limit(1000));
  const querySnapshot = await getDocs(q);
  const members = querySnapshot.docs.map(docToMember).filter(Boolean) as Member[];
  return members;
};

// Fetches a paginated slice of members.
export const getMembersPage = async (
  pageSize: number = 20,
  startAfterDocId?: string
): Promise<{ members: Member[]; lastDocId: string | null }> => {
  let q = query(getMembersQuery(), orderBy("lastName", "asc"), limit(pageSize));

  if (startAfterDocId) {
    const startAfterDoc = await getDoc(
      doc(getMembersCollection(), startAfterDocId)
    );
    if (startAfterDoc.exists()) {
      q = query(q, startAfter(startAfterDoc));
    }
  }

  const querySnapshot = await getDocs(q);
  const members = querySnapshot.docs
    .map(docToMember)
    .filter(Boolean) as Member[];
  const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

  return {
    members,
    lastDocId: lastDoc ? lastDoc.id : null,
  };
};

// Изчисляване на възрастовата група на базата на годината на раждане
export const calculateAgeGroup = (
  dateOfBirth?: string | Date | null
): string | null => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth as string | Date);
  if (isNaN(dob.getTime())) return null;

  const birthYear = dob.getFullYear();
  const currentYear = new Date().getFullYear();
  const diff = currentYear - birthYear;

  if (diff <= 8) return "U9";
  if (diff === 9 || diff === 10) return "U11";
  if (diff === 11 || diff === 12) return "U13";
  if (diff === 13 || diff === 14) return "U15";
  if (diff === 15 || diff === 16) return "U17";
  if (diff === 17 || diff === 18) return "U19";
  if (diff >= 19) return "Мъже/Жени";

  return null;
};

// Adds a new member to the database, using server-side timestamps.
export const addMember = async (
  memberData: Omit<Member, "id" | "name" | "registrationDate" | "updatedAt">
): Promise<string> => {
  // Validate input early
  const validation = validateMemberData({ ...memberData, id: "tmp", name: "tmp", registrationDate: new Date().toISOString(), updatedAt: new Date().toISOString() });
  if (!validation.success) {
    throw new Error(`Invalid member data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }
  const ageGroup = calculateAgeGroup(memberData.dateOfBirth);
  const name = [
    memberData.firstName,
    memberData.middleName,
    memberData.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const dataToAdd = {
    ...memberData,
    name,
    ageGroup,
    dateOfBirth: memberData.dateOfBirth
      ? Timestamp.fromDate(new Date(memberData.dateOfBirth))
      : null,
    registrationDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
    siteId: getSiteConfig().id, // Explicitly add siteId if not handled by converter correctly (converter handles it but extra safety)
  };

  const docRef = await addDoc(
    getMembersCollection() as CollectionReference<Omit<Member, "id">>,
    dataToAdd
  );
  return docRef.id;
};

// Creates a member and a default subscription + sale in a single transaction.
export const createMemberWithSubscription = async (
  memberData: Omit<Member, "id" | "name" | "registrationDate" | "updatedAt">,
  defaultService: { id: string; name: string; price: number; currency?: string },
  createdBy?: { uid?: string; email?: string }
): Promise<{ memberId: string; subscriptionId: string }> => {
  const db = await import("@/lib/firebase").then((m) => m.getDb());
  const membersCol = getMembersCollection();
  const subsCol = getMemberSubscriptionsCollection();
  const salesCol = getSalesCollection();

  const memberRef = doc(membersCol);
  const subRef = doc(subsCol);
  const saleRef = doc(salesCol);

  // Validate minimal member fields before transaction
  const validation = validateMemberData({ ...memberData, id: "tmp", name: "tmp", registrationDate: new Date().toISOString(), updatedAt: new Date().toISOString() });
  if (!validation.success) {
    throw new Error(`Invalid member data: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }

  await runTransaction(db, async (transaction) => {
    // Prepare member data
    const ageGroup = calculateAgeGroup(memberData.dateOfBirth);
    const name = [memberData.firstName, memberData.middleName, memberData.lastName]
      .filter(Boolean)
      .join(" ");

    const dataToAdd = {
      ...memberData,
      name,
      ageGroup,
      dateOfBirth: memberData.dateOfBirth
        ? Timestamp.fromDate(new Date(memberData.dateOfBirth))
        : null,
      registrationDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
      siteId: getSiteConfig().id,
      createdBy: createdBy || null,
    } as Record<string, unknown>;

    transaction.set(memberRef, dataToAdd);

    // Prepare subscription
    const startDate = new Date().toISOString();
    const endDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString();

    const subscription = {
      id: subRef.id,
      memberId: memberRef.id,
      serviceId: defaultService.id,
      serviceName: defaultService.name,
      startDate,
      endDate,
      status: "active",
      price: defaultService.price,
      currency: defaultService.currency || "EUR",
      pricePaid: 0,
      paymentHistory: [],
      paymentsMadeCount: 0,
      totalPaymentsCount: 12,
      licenseGranted: false,
      apparelGranted: false,
      linkedSubscriptionId: null,
      siteId: getSiteConfig().id,
    } as Record<string, unknown>;

    transaction.set(subRef, subscription);

    // Prepare sale
    const saleData = {
      id: saleRef.id,
      memberId: memberRef.id,
      subscriptionId: subRef.id,
      saleDate: Timestamp.now(),
      items: [
        {
          productId: defaultService.id,
          name: defaultService.name,
          quantity: 1,
          price: defaultService.price,
        },
      ],
      totalAmount: defaultService.price,
      currency: defaultService.currency || "EUR",
      isPaid: false,
      status: defaultService.price > 0 ? "completed" : "informational",
      siteId: getSiteConfig().id,
    } as Record<string, unknown>;

    transaction.set(saleRef, saleData);

    // Optionally update member lastPaymentDate if price > 0
    if (defaultService.price > 0) {
      transaction.update(memberRef, {
        lastPaymentDate: new Date().toISOString(),
      });
    }
  });

  return { memberId: memberRef.id, subscriptionId: subRef.id };
};

// Updates an existing member in the database, using server-side timestamps.
export const updateMember = async (
  id: string,
  memberData: Partial<Omit<Member, "id" | "name">>
): Promise<void> => {
  const memberRef = doc(getMembersCollection(), id);

  // If a new image is being uploaded, we should ideally clean up the old one
  if (memberData.avatarUrl) {
    try {
      const oldDoc = await getDoc(memberRef);
      const oldData = oldDoc.data();
      if (oldData?.avatarUrl && oldData.avatarUrl !== memberData.avatarUrl) {
        // Only try to delete if it's a Firebase Storage URL we own
        if (oldData.avatarUrl.includes("firebasestorage.googleapis.com")) {
          // Assume path 'avatars/{id}'
          await deleteFile(`avatars/${id}`).catch((err) =>
            logger.error("Failed to delete old avatar:", err)
          );
        }
      }
    } catch (err) {
      logger.error("Error during image cleanup:", err);
    }
  }

  const dataToUpdate: { [key: string]: unknown } = { ...memberData };

  if ("dateOfBirth" in dataToUpdate) {
    dataToUpdate.ageGroup = calculateAgeGroup(
      dataToUpdate.dateOfBirth as string | Date | null
    );
    if (dataToUpdate.dateOfBirth) {
      dataToUpdate.dateOfBirth = Timestamp.fromDate(
        new Date(dataToUpdate.dateOfBirth as string)
      );
    } else {
      dataToUpdate.dateOfBirth = null;
    }
  }

  dataToUpdate.updatedAt = serverTimestamp();

  await updateDoc(memberRef, dataToUpdate);
};

// Deletes a member from the database.
export const deleteMember = async (id: string): Promise<void> => {
  const memberRef = doc(getMembersCollection(), id);
  await deleteDoc(memberRef);
};

// --- Bulk Operations ---

export const bulkUpdateMemberStatus = async (
  memberIds: string[],
  status: "active" | "inactive" | "suspended"
): Promise<void> => {
  const { writeBatch, doc } = await import("firebase/firestore");
  const { getDb } = await import("@/lib/firebase");
  const db = getDb();
  const batch = writeBatch(db);

  memberIds.forEach((id) => {
    const memberRef = doc(db, "members", id);
    batch.update(memberRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
};
