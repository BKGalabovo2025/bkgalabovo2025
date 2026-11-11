"use server";
import "server-only";

import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";

import { ensureAdmin } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import type { PublicTripSignDataDTO } from "@/types/business-trip.types";

interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * Gets or creates a unique signing token for a trip participant (athlete).
 */
export async function getOrCreateTripSigningTokenAction(input: {
  tripId: string;
  memberId: string;
  memberName: string;
  siteId?: string;
  role?: string;
}): Promise<ActionResponse<{ token: string }>> {
  try {
    await ensureAdmin();
    if (!input.tripId || !input.memberId) {
      return {
        success: false,
        error: "Липсват задължителни параметри (tripId, memberId).",
      };
    }

    const adminDb = getAdminDb();
    const tripRef = adminDb.collection("business_trips").doc(input.tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return { success: false, error: "Командировката не беше намерена." };
    }

    const tripData = tripSnap.data() || {};
    const existingEntry = tripData.signingTokens?.[input.memberId];

    if (existingEntry?.token) {
      // Verify token doc exists in trip_signing_tokens
      const existingTokenDoc = await adminDb
        .collection("trip_signing_tokens")
        .doc(existingEntry.token)
        .get();

      if (existingTokenDoc.exists) {
        return {
          success: true,
          data: { token: existingEntry.token },
        };
      }
    }

    // Generate new secure UUID token
    const token = crypto.randomUUID();
    const now = new Date().toISOString();
    const siteId = input.siteId || tripData.siteId || "bkgalabovo";

    await adminDb
      .collection("trip_signing_tokens")
      .doc(token)
      .set({
        token,
        tripId: input.tripId,
        memberId: input.memberId,
        memberName: input.memberName,
        role: input.role || "Състезател",
        siteId,
        createdAt: now,
      });

    await tripRef.update({
      [`signingTokens.${input.memberId}`]: {
        token,
        memberId: input.memberId,
        memberName: input.memberName,
        role: input.role || "Състезател",
        createdAt: now,
      },
      updatedAt: now,
    });

    return {
      success: true,
      data: { token },
    };
  } catch (error) {
    console.error("Error in getOrCreateTripSigningTokenAction:", error);
    return {
      success: false,
      error: "Грешка при генериране на линк за подписване.",
    };
  }
}

/**
 * Public action: retrieves safe trip and participant metadata for signing page.
 */
export async function getPublicTripSignDataAction(
  token: string
): Promise<ActionResponse<PublicTripSignDataDTO>> {
  try {
    if (!token || typeof token !== "string" || token.length < 8) {
      return { success: false, error: "Невалиден код за достъп." };
    }

    const adminDb = getAdminDb();
    const tokenSnap = await adminDb
      .collection("trip_signing_tokens")
      .doc(token)
      .get();

    if (!tokenSnap.exists) {
      return {
        success: false,
        error: "Линкът за подписване е невалиден, изтекъл или премахнат.",
      };
    }

    const tokenData = tokenSnap.data()!;
    const tripSnap = await adminDb
      .collection("business_trips")
      .doc(tokenData.tripId)
      .get();

    if (!tripSnap.exists) {
      return {
        success: false,
        error: "Командировката към този подпис не беше намерена.",
      };
    }

    const trip = tripSnap.data()!;
    const existingSig =
      trip.signatures?.athletes?.[tokenData.memberId] ||
      (trip.signatures as Record<string, string> | undefined)?.[
        tokenData.memberId
      ] ||
      null;

    const dto: PublicTripSignDataDTO = {
      token,
      tripId: tokenData.tripId,
      memberId: tokenData.memberId,
      memberName: tokenData.memberName,
      role: tokenData.role || "Състезател",
      tripTitle: trip.title || "Командировка за състезание",
      destination: trip.destination || "",
      startDate: trip.startDate || "",
      endDate: trip.endDate || "",
      organizer: trip.organizer || undefined,
      hostClub: trip.hostClub || undefined,
      coachName: trip.coachName || undefined,
      siteId: tokenData.siteId || trip.siteId || "bkgalabovo",
      existingSignature: existingSig,
    };

    return {
      success: true,
      data: dto,
    };
  } catch (error) {
    console.error("Error in getPublicTripSignDataAction:", error);
    return {
      success: false,
      error: "Възникна грешка при зареждане на данните за подписване.",
    };
  }
}

/**
 * Internal helper to save an athlete's signature to their member profile
 * and propagate it across other business trips where they are participants.
 */
async function propagateAthleteSignatureInternal(
  adminDb: FirebaseFirestore.Firestore,
  params: {
    memberId: string;
    signatureBase64: string;
    siteId?: string;
    skipTripId?: string;
    overwriteExisting?: boolean;
  }
): Promise<{ updatedTripsCount: number }> {
  const { memberId, signatureBase64, siteId, skipTripId, overwriteExisting } =
    params;
  const now = new Date().toISOString();

  // 1. Update member profile with the stored signature
  try {
    const memberRef = adminDb.collection("members").doc(memberId);
    await memberRef.set(
      {
        signature: signatureBase64,
        signatureUpdatedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`Failed to update member ${memberId} profile signature:`, err);
  }

  // 2. Query all business trips and filter by participant
  let updatedTripsCount = 0;
  try {
    const tripsSnap = await adminDb.collection("business_trips").get();

    if (!tripsSnap.empty) {
      const BATCH_SIZE = 400;
      let batch = adminDb.batch();
      let opCount = 0;

      for (const doc of tripsSnap.docs) {
        if (skipTripId && doc.id === skipTripId) continue;
        const data = doc.data();

        // Check siteId matching: allow same siteId, legacy missing, or "default"
        const isSiteMatch =
          !siteId ||
          !data.siteId ||
          data.siteId === "default" ||
          siteId === "default" ||
          data.siteId === siteId;
        if (!isSiteMatch) continue;

        // Check if member is a participant in this trip (supports both participantsIds and legacy participantIds)
        const participantList = [
          ...(Array.isArray(data.participantsIds) ? data.participantsIds : []),
          ...(Array.isArray(data.participantIds)
            ? (data.participantIds as string[])
            : []),
        ];
        const isParticipant = participantList.some(
          (id) =>
            String(id).trim().toLowerCase() === memberId.trim().toLowerCase()
        );
        if (!isParticipant) continue;

        const existingSig =
          data.signatures?.athletes?.[memberId] ||
          (data.signatures as Record<string, string> | undefined)?.[memberId];

        // Only update if not already signed, unless overwrite is explicitly requested
        if (!existingSig || overwriteExisting) {
          batch.update(doc.ref, {
            [`signatures.athletes.${memberId}`]: signatureBase64,
            updatedAt: now,
          });
          opCount++;
          updatedTripsCount++;

          if (opCount >= BATCH_SIZE) {
            await batch.commit();
            batch = adminDb.batch();
            opCount = 0;
          }
        }
      }

      if (opCount > 0) {
        await batch.commit();
      }
    }
  } catch (err) {
    console.error("Error propagating athlete signature to trips:", err);
  }

  return { updatedTripsCount };
}

/**
 * Public action: submits athlete's blue signature for the business trip.
 * Automatically saves the signature to the athlete's profile and propagates it
 * to all other trips where this athlete is a participant but lacks a signature.
 */
export async function submitPublicTripSignatureAction(input: {
  token: string;
  signatureBase64: string;
}): Promise<ActionResponse<{ updatedTripsCount?: number }>> {
  try {
    const { token, signatureBase64 } = input;

    if (!token || typeof token !== "string" || token.length < 8) {
      return { success: false, error: "Невалиден код за достъп." };
    }

    if (
      !signatureBase64 ||
      typeof signatureBase64 !== "string" ||
      !signatureBase64.startsWith("data:image/") ||
      signatureBase64.length > 1_500_000
    ) {
      return { success: false, error: "Невалиден формат на подписа." };
    }

    const adminDb = getAdminDb();
    const tokenSnap = await adminDb
      .collection("trip_signing_tokens")
      .doc(token)
      .get();

    if (!tokenSnap.exists) {
      return {
        success: false,
        error: "Линкът за подписване е невалиден или премахнат.",
      };
    }

    const tokenData = tokenSnap.data()!;
    const tripRef = adminDb.collection("business_trips").doc(tokenData.tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      return { success: false, error: "Командировката не беше намерена." };
    }

    const now = new Date().toISOString();

    await tripRef.update({
      [`signatures.athletes.${tokenData.memberId}`]: signatureBase64,
      updatedAt: now,
    });

    // Auto-propagate to member profile and other unsigned trips!
    let propagatedCount = 0;
    try {
      const res = await propagateAthleteSignatureInternal(adminDb, {
        memberId: tokenData.memberId,
        signatureBase64,
        siteId: tokenData.siteId || tripSnap.data()?.siteId,
        skipTripId: tokenData.tripId,
      });
      propagatedCount = res.updatedTripsCount;
    } catch (err) {
      console.error("Error auto-propagating trip signature:", err);
    }

    const message =
      propagatedCount > 0
        ? `Подписът беше записан успешно във ведомостта и автоматично приложен към още ${propagatedCount} ваши участия!`
        : "Подписът беше записан успешно във ведомостта!";

    return {
      success: true,
      message,
      data: { updatedTripsCount: propagatedCount },
    };
  } catch (error) {
    console.error("Error in submitPublicTripSignatureAction:", error);
    return {
      success: false,
      error: "Грешка при записване на подписа. Моля, опитайте отново.",
    };
  }
}

/**
 * Admin action: saves an athlete's direct device signature for a trip,
 * persists it to the athlete's member profile, and propagates it across all other trips.
 */
export async function saveDirectAthleteSignatureAction(input: {
  tripId?: string;
  memberId: string;
  signatureBase64: string;
  siteId?: string;
  propagateAll?: boolean;
}): Promise<ActionResponse<{ updatedTripsCount: number }>> {
  try {
    await ensureAdmin();
    const {
      tripId,
      memberId,
      signatureBase64,
      siteId,
      propagateAll = true,
    } = input;

    if (!memberId) {
      return { success: false, error: "Липсва идентификатор на състезателя." };
    }

    if (
      !signatureBase64 ||
      typeof signatureBase64 !== "string" ||
      !signatureBase64.startsWith("data:image/") ||
      signatureBase64.length > 1_500_000
    ) {
      return { success: false, error: "Невалиден формат на подписа." };
    }

    const adminDb = getAdminDb();
    const now = new Date().toISOString();

    // 1. If tripId is provided, update that trip
    if (tripId) {
      const tripRef = adminDb.collection("business_trips").doc(tripId);
      await tripRef.update({
        [`signatures.athletes.${memberId}`]: signatureBase64,
        updatedAt: now,
      });
    }

    // 2. Persist to member profile and propagate
    let updatedTripsCount = 0;
    if (propagateAll) {
      const res = await propagateAthleteSignatureInternal(adminDb, {
        memberId,
        signatureBase64,
        siteId,
        skipTripId: tripId,
      });
      updatedTripsCount = res.updatedTripsCount;
    } else {
      // Just save to member profile without propagating to trips
      await adminDb.collection("members").doc(memberId).set(
        {
          signature: signatureBase64,
          signatureUpdatedAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    const totalSigned = tripId ? updatedTripsCount + 1 : updatedTripsCount;
    const msg =
      updatedTripsCount > 0
        ? `Подписът беше записан успешно и приложен към общо ${totalSigned} ведомости!`
        : "Подписът беше записан успешно!";

    return {
      success: true,
      message: msg,
      data: { updatedTripsCount },
    };
  } catch (error) {
    console.error("Error in saveDirectAthleteSignatureAction:", error);
    return {
      success: false,
      error: "Грешка при запазване и синхронизиране на подписа.",
    };
  }
}

/**
 * Admin action: Batch-applies an athlete's stored signature to all trips
 * where they are listed as participant but do not have a signature yet.
 */
export async function batchApplyAthleteSignatureToTripsAction(input: {
  memberId: string;
  siteId?: string;
  overwriteExisting?: boolean;
}): Promise<ActionResponse<{ updatedTripsCount: number }>> {
  try {
    await ensureAdmin();
    const { memberId, siteId, overwriteExisting = false } = input;

    if (!memberId) {
      return { success: false, error: "Липсва идентификатор на състезателя." };
    }

    const adminDb = getAdminDb();
    const memberSnap = await adminDb.collection("members").doc(memberId).get();

    if (!memberSnap.exists) {
      return { success: false, error: "Състезателят не беше намерен." };
    }

    const memberData = memberSnap.data() || {};
    const signatureBase64 = memberData.signature;

    if (!signatureBase64 || typeof signatureBase64 !== "string") {
      return {
        success: false,
        error:
          "Състезателят все още няма съхранен електронен подпис в профила си.",
      };
    }

    const res = await propagateAthleteSignatureInternal(adminDb, {
      memberId,
      signatureBase64,
      siteId,
      overwriteExisting,
    });

    const msg =
      res.updatedTripsCount > 0
        ? `Съхраненият подпис беше успешно приложен към ${res.updatedTripsCount} ведомости!`
        : "Всички ведомости за този състезател вече са подписани.";

    return {
      success: true,
      message: msg,
      data: { updatedTripsCount: res.updatedTripsCount },
    };
  } catch (error) {
    console.error("Error in batchApplyAthleteSignatureToTripsAction:", error);
    return {
      success: false,
      error: "Грешка при прилагане на подписа към ведомостите.",
    };
  }
}

/**
 * Admin action: Saves or updates an athlete's signature directly from the member profile
 * and immediately applies it to all their business trips.
 */
export async function saveMemberStoredSignatureAction(input: {
  memberId: string;
  signatureBase64: string;
  siteId?: string;
}): Promise<ActionResponse<{ updatedTripsCount: number }>> {
  try {
    await ensureAdmin();
    const { memberId, signatureBase64, siteId } = input;

    if (!memberId) {
      return { success: false, error: "Липсва идентификатор на състезателя." };
    }

    if (
      !signatureBase64 ||
      typeof signatureBase64 !== "string" ||
      !signatureBase64.startsWith("data:image/") ||
      signatureBase64.length > 1_500_000
    ) {
      return { success: false, error: "Невалиден формат на подписа." };
    }

    const adminDb = getAdminDb();
    const res = await propagateAthleteSignatureInternal(adminDb, {
      memberId,
      signatureBase64,
      siteId,
    });

    const msg =
      res.updatedTripsCount > 0
        ? `Подписът беше съхранен в профила и автоматично приложен към ${res.updatedTripsCount} ведомости!`
        : "Подписът беше съхранен успешно в профила на състезателя!";

    return {
      success: true,
      message: msg,
      data: { updatedTripsCount: res.updatedTripsCount },
    };
  } catch (error) {
    console.error("Error in saveMemberStoredSignatureAction:", error);
    return {
      success: false,
      error: "Грешка при съхраняване на подписа в профила.",
    };
  }
}

/**
 * Admin action: Clears stored signature from member's profile.
 */
export async function clearMemberStoredSignatureAction(input: {
  memberId: string;
}): Promise<ActionResponse<void>> {
  try {
    await ensureAdmin();
    const { memberId } = input;

    if (!memberId) {
      return { success: false, error: "Липсва идентификатор на състезателя." };
    }

    const adminDb = getAdminDb();
    await adminDb.collection("members").doc(memberId).update({
      signature: FieldValue.delete(),
      signatureUpdatedAt: FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Съхраненият подпис беше премахнат от профила на състезателя.",
    };
  } catch (error) {
    console.error("Error in clearMemberStoredSignatureAction:", error);
    return {
      success: false,
      error: "Грешка при премахване на подписа от профила.",
    };
  }
}

/**
 * Clears an athlete's signature on a trip (Admin action).
 */
export async function clearTripAthleteSignatureAction(input: {
  tripId: string;
  memberId: string;
}): Promise<ActionResponse<void>> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const tripRef = adminDb.collection("business_trips").doc(input.tripId);

    await tripRef.update({
      [`signatures.athletes.${input.memberId}`]: FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: "Подписът беше премахнат." };
  } catch (error) {
    console.error("Error in clearTripAthleteSignatureAction:", error);
    return { success: false, error: "Грешка при изчистване на подписа." };
  }
}

/**
 * Robust extractor to find an athlete's signature in a business trip document,
 * handling nested maps, legacy flat keys, case-sensitivity, or single-signature objects.
 */
function extractAthleteSignatureFromTrip(
  data: Record<string, unknown>,
  memberId: string
): string | null {
  const normId = memberId.trim().toLowerCase();

  // 1. Nested in data.signatures.athletes
  const sigs = data.signatures as Record<string, unknown> | undefined;
  if (sigs && typeof sigs === "object") {
    const athletes = sigs.athletes as Record<string, unknown> | undefined;
    if (athletes && typeof athletes === "object") {
      if (typeof athletes[memberId] === "string" && athletes[memberId]) {
        return athletes[memberId] as string;
      }
      for (const [k, v] of Object.entries(athletes)) {
        if (k.trim().toLowerCase() === normId && typeof v === "string" && v) {
          return v;
        }
      }
    }

    // 2. Direct key under signatures: data.signatures[memberId]
    if (typeof sigs[memberId] === "string" && sigs[memberId]) {
      return sigs[memberId] as string;
    }
    for (const [k, v] of Object.entries(sigs)) {
      if (k.trim().toLowerCase() === normId && typeof v === "string" && v) {
        return v;
      }
    }
  }

  // 3. Flat dotted keys in data (e.g. "signatures.athletes.MEMBERID")
  for (const [k, v] of Object.entries(data)) {
    if (
      k.toLowerCase().includes(normId) &&
      typeof v === "string" &&
      v.startsWith("data:image/")
    ) {
      return v;
    }
  }

  // 4. Fallback: if only one athlete signature exists in the trip
  if (sigs && typeof sigs === "object") {
    const athletes = sigs.athletes as Record<string, unknown> | undefined;
    if (athletes && typeof athletes === "object") {
      const keys = Object.keys(athletes);
      if (keys.length === 1 && typeof athletes[keys[0]] === "string") {
        return athletes[keys[0]] as string;
      }
    }
  }

  return null;
}

/**
 * Admin action: Finds any existing signature for a member from their past business trips,
 * saves it to their profile, and propagates it across all their other unsigned trips.
 */
export async function syncMemberSignatureFromTripsAction(input: {
  memberId: string;
  tripId?: string;
  signatureBase64?: string;
  siteId?: string;
}): Promise<
  ActionResponse<{
    signatureBase64: string;
    sourceTripTitle: string;
    updatedTripsCount: number;
  }>
> {
  try {
    await ensureAdmin();
    const { memberId, tripId, signatureBase64, siteId } = input;

    if (!memberId) {
      return { success: false, error: "Липсва идентификатор на състезателя." };
    }

    const adminDb = getAdminDb();
    let foundSig: string | null = signatureBase64 || null;
    let foundTripTitle = "Командировка";

    // 1. If tripId is specified and foundSig not yet given, check that trip
    if (!foundSig && tripId) {
      const snap = await adminDb.collection("business_trips").doc(tripId).get();
      if (snap.exists) {
        const data = snap.data() || {};
        foundTripTitle = (data.title as string) || "Командировка";
        foundSig = extractAthleteSignatureFromTrip(data, memberId);
      }
    }

    // 2. Otherwise search all trips where member participated
    if (!foundSig) {
      const tripsSnap = await adminDb
        .collection("business_trips")
        .where("participantsIds", "array-contains", memberId)
        .get();

      const sortedDocs = tripsSnap.docs.sort((a, b) => {
        const dateA = a.data().startDate || a.data().createdAt || "";
        const dateB = b.data().startDate || b.data().createdAt || "";
        return dateB.localeCompare(dateA);
      });

      for (const doc of sortedDocs) {
        const data = doc.data();
        const sig = extractAthleteSignatureFromTrip(data, memberId);
        if (sig) {
          foundSig = sig;
          foundTripTitle = (data.title as string) || "Командировка";
          break;
        }
      }
    }

    // 3. Fallback: search all trips in collection
    if (!foundSig) {
      const allTripsSnap = await adminDb.collection("business_trips").get();
      for (const doc of allTripsSnap.docs) {
        const data = doc.data();
        const sig = extractAthleteSignatureFromTrip(data, memberId);
        if (sig) {
          foundSig = sig;
          foundTripTitle = (data.title as string) || "Командировка";
          break;
        }
      }
    }

    if (!foundSig) {
      return {
        success: false,
        error:
          "Не беше открит съществуващ подпис за този състезател в командировките.",
      };
    }

    // 4. Propagate and save to member profile
    const res = await propagateAthleteSignatureInternal(adminDb, {
      memberId,
      signatureBase64: foundSig,
      siteId,
    });

    const msg =
      res.updatedTripsCount > 0
        ? `Подписът от „${foundTripTitle}“ беше успешно запазен в профила и приложен към ${res.updatedTripsCount} командировки!`
        : `Подписът от „${foundTripTitle}“ беше успешно запазен в профила на състезателя!`;

    return {
      success: true,
      message: msg,
      data: {
        signatureBase64: foundSig,
        sourceTripTitle: foundTripTitle,
        updatedTripsCount: res.updatedTripsCount,
      },
    };
  } catch (error) {
    console.error("Error in syncMemberSignatureFromTripsAction:", error);
    return {
      success: false,
      error: "Грешка при синхронизиране на подписа от командировка.",
    };
  }
}

/**
 * Admin action: Scans all business trips, finds any existing athlete signatures,
 * backfills them into the respective member profiles, and propagates them.
 */
export async function backfillAllAthleteSignaturesFromTripsAction(
  siteId?: string
): Promise<
  ActionResponse<{ syncedMembersCount: number; updatedTripsCount: number }>
> {
  try {
    await ensureAdmin();
    const adminDb = getAdminDb();
    const tripsSnap = await adminDb.collection("business_trips").get();

    if (tripsSnap.empty) {
      return {
        success: true,
        data: { syncedMembersCount: 0, updatedTripsCount: 0 },
      };
    }

    const memberSignatures = new Map<string, { sig: string; date: string }>();

    for (const doc of tripsSnap.docs) {
      const data = doc.data();
      const isSiteMatch =
        !siteId ||
        !data.siteId ||
        data.siteId === "default" ||
        siteId === "default" ||
        data.siteId === siteId;
      if (!isSiteMatch) continue;

      const athletes = data.signatures?.athletes || {};
      const tripDate = data.startDate || data.createdAt || "";

      for (const [mId, sig] of Object.entries(athletes)) {
        if (typeof sig === "string" && sig.startsWith("data:image/")) {
          const current = memberSignatures.get(mId);
          if (!current || tripDate > current.date) {
            memberSignatures.set(mId, { sig, date: tripDate });
          }
        }
      }
    }

    let syncedMembersCount = 0;
    let totalTripsUpdated = 0;

    for (const [mId, info] of memberSignatures.entries()) {
      const res = await propagateAthleteSignatureInternal(adminDb, {
        memberId: mId,
        signatureBase64: info.sig,
        siteId,
      });
      syncedMembersCount++;
      totalTripsUpdated += res.updatedTripsCount;
    }

    return {
      success: true,
      message: `Синхронизирани са ${syncedMembersCount} профила и са обновени ${totalTripsUpdated} ведомости.`,
      data: { syncedMembersCount, updatedTripsCount: totalTripsUpdated },
    };
  } catch (error) {
    console.error(
      "Error in backfillAllAthleteSignaturesFromTripsAction:",
      error
    );
    return {
      success: false,
      error: "Грешка при глобално синхронизиране на подписите.",
    };
  }
}
