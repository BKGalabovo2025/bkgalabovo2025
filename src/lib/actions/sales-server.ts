import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { Sale, Member, ClubService, Family } from "@/types";
import { getCachedSalesForBranch } from "@/lib/db/sales";

// Помощна функция за преобразуване на Firestore документи с конвертиране на Timestamps в ISO низове
function snapToData<T>(
  doc: admin.firestore.DocumentSnapshot | admin.firestore.QueryDocumentSnapshot
): T | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const convertTimestamps = (val: any): any => {
    if (!val) return val;
    if (typeof val.toDate === "function") {
      return val.toDate().toISOString();
    }
    if (val instanceof admin.firestore.Timestamp) {
      return val.toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    if (typeof val === "object") {
      const copy: any = {};
      for (const key of Object.keys(val)) {
        copy[key] = convertTimestamps(val[key]);
      }
      return copy;
    }
    return val;
  };

  return {
    id: doc.id,
    ...convertTimestamps(data),
  } as T;
}

/**
 * �?звлича всички продажби на сървъра.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getInventorySalesServerAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      throw new Error("Неоторизиран достъп.");
    }

    const sales = await getCachedSalesForBranch(activeBranch);

    return {
      success: true,
      data: sales,
    };
  } catch (error: unknown) {
    console.error("Error getInventorySalesServerAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при извличане на продажбите.",
    };
  }
}

/**
 * �?звлича пълните детайли по разписка на сървъра.
 */
/* eslint-disable sonarjs/cognitive-complexity */
export async function getReceiptDetailsServerAction(saleId: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      throw new Error("Неоторизиран достъп.");
    }

    const adminDb = getAdminDb();
    const saleSnap = await adminDb.collection("sales").doc(saleId).get();

    if (!saleSnap.exists) {
      return {
        success: false,
        error: "Продажбата не е намерена.",
      };
    }

    const sale = snapToData<Sale>(saleSnap);
    if (!sale) {
      console.error("Sale data is incomplete:", sale);
      return {
        success: false,
        error: "Непълни данни за продажбата.",
      };
    }

    const isGuest = sale.memberId === "GUEST_EXTERNAL";
    const isWalkIn = !sale.memberId || sale.memberId === "Walk-in Customer";
    const shouldFetchMember = !isGuest && !isWalkIn && sale.memberId;

    // Паралелно извличане на основните свързани документи
    const memberSnap = shouldFetchMember
      ? await adminDb.collection("members").doc(sale.memberId).get()
      : null;

    let member =
      memberSnap && memberSnap.exists ? snapToData<Member>(memberSnap) : null;

    if (!member) {
      if (sale.memberId === "GUEST_EXTERNAL") {
        member = {
          id: "GUEST_EXTERNAL",
          firstName: "Външен",
          lastName: "гост",
          email: "",
          phone: "",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          siteId: sale.siteId || "bkgalabovo",
        } as unknown as Member;
      } else {
        member = {
          id: sale.memberId || "Walk-in Customer",
          firstName: "Външен",
          lastName: "клиент",
          email: "",
          phone: "",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          siteId: sale.siteId || "bkgalabovo",
        } as unknown as Member;
      }
    }

    // �?звличане на свързана услуга (ако е необходимо)
    const service: ClubService | null = null;

    // �?звличане на свързано лице (родител/дете)
    let relatedMember: Member | null = null;
    if (member.relatedMemberId) {
      const relatedSnap = await adminDb
        .collection("members")
        .doc(member.relatedMemberId)
        .get();
      relatedMember = snapToData<Member>(relatedSnap);
    }

    // �?звличане на семейство и други членове на семейството
    let family: Family | null = null;
    const familyMembers: Member[] = [];

    const familyQuerySnapshot = await adminDb
      .collection("families")
      .where("memberIds", "array-contains", sale.memberId)
      .limit(1)
      .get();

    if (!familyQuerySnapshot.empty) {
      const familyDoc = familyQuerySnapshot.docs[0];
      family = snapToData<Family>(familyDoc);

      if (family && family.memberIds && family.memberIds.length > 0) {
        const otherMemberIds = family.memberIds.filter(
          (id) => id !== sale.memberId
        );
        if (otherMemberIds.length > 0) {
          // Взимаме останалите членове на семейството
          const otherMembersPromises = otherMemberIds.map((id) =>
            adminDb.collection("members").doc(id).get()
          );
          const otherMembersSnaps = await Promise.all(otherMembersPromises);
          otherMembersSnaps.forEach((mSnap) => {
            const m = snapToData<Member>(mSnap);
            if (m) familyMembers.push(m);
          });
        }
      }
    }

    return {
      success: true,
      data: {
        sale,
        member,
        relatedMember,
        service,
        family,
        familyMembers,
      },
    };
  } catch (error: unknown) {
    console.error("Error getReceiptDetailsServerAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при извличане на детайлите за разписката.",
    };
  }
}
