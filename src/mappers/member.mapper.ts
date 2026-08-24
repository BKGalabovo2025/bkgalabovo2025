import { DocumentSnapshot } from "firebase/firestore";

import { Member, MemberSchema } from "@/types/member.types";

/**
 * Converts a Firestore document to a Member object with robust validation using Zod.
 */
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
    siteId: data.siteId,
    firstName: data.firstName || data.name?.split(" ")[0] || "Неизвестно",
    lastName:
      data.lastName || data.name?.split(" ").slice(1).join(" ") || "Неизвестно",
    name: name || "Неизвестно",
    status: data.status || "active",
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
    console.warn(
      "Validation failed for ID %s. Data:",
      docSnap.id,
      dataToParse,
      error
    );
    return null;
  }
};

/**
 * Изчислява възрастовата група на базата на годината на раждане.
 */
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
