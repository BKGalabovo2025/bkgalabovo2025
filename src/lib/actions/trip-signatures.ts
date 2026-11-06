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
 * Public action: submits athlete's blue signature for the business trip.
 */
export async function submitPublicTripSignatureAction(input: {
  token: string;
  signatureBase64: string;
}): Promise<ActionResponse<void>> {
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

    return {
      success: true,
      message: "Подписът беше записан успешно във ведомостта!",
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
