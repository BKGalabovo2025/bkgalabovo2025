import { Member } from "@/types/member.types";
import { getSiteConfig } from "@/config/sites";
import { Timestamp, serverTimestamp } from "firebase/firestore";

// Import from new architectural layers
import { docToMember, calculateAgeGroup } from "@/mappers/member.mapper";
import {
  fetchMemberById,
  fetchAllMembers,
  createMemberDocument,
  updateMemberDocument,
  deleteMemberDocument,
  fetchRawMemberData,
} from "@/repositories/member.repository";

// Re-export for backwards compatibility if any external code relies on them
export { docToMember, calculateAgeGroup };

let membersCache: Member[] | null = null;
let lastFetchTime = 0;
let cachedSiteId: string | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

/**
 * Fetches a single member by their ID.
 */
export const getMemberById = async (id: string): Promise<Member | null> => {
  if (!id || id === "undefined") {
    console.error(`getMemberById was called with an invalid ID: ${id}`);
    return null;
  }
  return fetchMemberById(id);
};

/**
 * Fetches all members with a simple in-memory cache.
 */
export const getAllMembers = async (
  forceRefetch = false
): Promise<Member[]> => {
  const now = Date.now();
  const currentSiteId = getSiteConfig().id;

  // Return cached data if available, not expired, and matches the current site
  if (
    !forceRefetch &&
    membersCache &&
    cachedSiteId === currentSiteId &&
    now - lastFetchTime < CACHE_DURATION
  ) {
    return membersCache;
  }

  const members = await fetchAllMembers();

  // Update cache
  membersCache = members;
  lastFetchTime = now;
  cachedSiteId = currentSiteId;

  return members;
};

/**
 * Adds a new member to the database, enforcing business rules and server-side timestamps.
 */
export const addMember = async (
  memberData: Omit<Member, "id" | "name" | "updatedAt" | "registrationDate"> & {
    registrationDate?: string;
  }
): Promise<string> => {
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
    registrationDate: memberData.registrationDate
      ? Timestamp.fromDate(new Date(memberData.registrationDate))
      : serverTimestamp(),
    updatedAt: serverTimestamp(),
    siteId: getSiteConfig().id,
  };

  const newId = await createMemberDocument(dataToAdd);

  // Clear cache to reflect new data
  membersCache = null;

  return newId;
};

/**
 * Updates an existing member in the database, with side-effect handlers (e.g., avatar cleanup).
 */
export const updateMember = async (
  id: string,
  memberData: Partial<Omit<Member, "id" | "name">>
): Promise<void> => {
  // Side effect: Cleanup old avatar if changed
  if (memberData.avatarUrl) {
    try {
      const oldData = await fetchRawMemberData(id);
      if (oldData?.avatarUrl && oldData.avatarUrl !== memberData.avatarUrl) {
        if (oldData.avatarUrl.includes("firebasestorage.googleapis.com")) {
          // Dynamic import to avoid loading storage SDK unnecessarily
          const { deleteFile } = await import("./storage-service");
          await deleteFile(`avatars/${id}`).catch((err) =>
            console.error("Failed to delete old avatar:", err)
          );
        }
      }
    } catch (err) {
      console.error("Error during image cleanup:", err);
    }
  }

  const dataToUpdate: Record<string, unknown> = { ...memberData };

  // Business logic: recalculate age group if DOB changes
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

  await updateMemberDocument(id, dataToUpdate);

  // Clear cache to reflect new data
  membersCache = null;
};

/**
 * Deletes a member from the database.
 */
export const deleteMember = async (id: string): Promise<void> => {
  await deleteMemberDocument(id);
  
  // Clear cache
  membersCache = null;
};
