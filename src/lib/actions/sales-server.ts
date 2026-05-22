"use server";

import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { ensureAdminFromSession } from "@/lib/auth-utils";
import { Sale, Member, ClubService, Subscription, Family } from "@/types";

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
 * Извлича продажбите от инвентар на сървъра (subscriptionId == null).
 */
export async function getInventorySalesServerAction(activeBranch: string) {
  try {
    await ensureAdminFromSession();

    const adminDb = getAdminDb();
    let salesQuery: admin.firestore.Query = adminDb.collection("sales");

    // Филтриране по клон (мултитенант)
    if (activeBranch && activeBranch !== "bkgalabovo") {
      salesQuery = salesQuery.where("siteId", "==", activeBranch);
    }

    // Взимаме само инвентарни продажби (subscriptionId == null)
    // Firestore не поддържа директно "==" null в комбинация с други филтри лесно без индекси,
    // но можем да извлечем продажбите и да ги филтрираме или да използваме query.
    // За да сме сигурни в съвместимостта и бързината, извличаме и филтрираме в паметта.
    const snapshot = await salesQuery.get();

    const sales = snapshot.docs
      .map((doc) => snapToData<Sale>(doc))
      .filter((sale): sale is Sale => sale !== null && !sale.subscriptionId)
      .sort(
        (a, b) =>
          new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
      );

    return {
      success: true,
      data: sales,
    };
  } catch (error: any) {
    console.error("Error getInventorySalesServerAction:", error);
    return {
      success: false,
      error: error.message || "Грешка при извличане на продажбите.",
    };
  }
}

/**
 * Извлича пълните детайли по разписка на сървъра.
 */
export async function getReceiptDetailsServerAction(saleId: string) {
  try {
    await ensureAdminFromSession();

    const adminDb = getAdminDb();
    const saleSnap = await adminDb.collection("sales").doc(saleId).get();

    if (!saleSnap.exists) {
      console.error("No sale found with ID:", saleId);
      return { success: false, error: "Продажбата не е намерена." };
    }

    const sale = snapToData<Sale>(saleSnap);
    if (!sale || !sale.memberId) {
      console.error("Sale data is incomplete:", sale);
      return { success: false, error: "Непълни данни за продажбата." };
    }

    // Паралелно извличане на основните свързани документи
    const memberDocPromise = adminDb
      .collection("members")
      .doc(sale.memberId)
      .get();

    let subscriptionPromise = Promise.resolve(
      null as admin.firestore.DocumentSnapshot | null
    );
    if (sale.subscriptionId) {
      subscriptionPromise = adminDb
        .collection("member_subscriptions")
        .doc(sale.subscriptionId)
        .get();
    }

    const [memberSnap, subscriptionSnap] = await Promise.all([
      memberDocPromise,
      subscriptionPromise,
    ]);

    const member = snapToData<Member>(memberSnap);
    if (!member) {
      return { success: false, error: "Членът не е намерен." };
    }

    const subscription = subscriptionSnap
      ? snapToData<Subscription>(subscriptionSnap)
      : null;

    // Извличане на свързана услуга, ако има абонамент
    let service: ClubService | null = null;
    if (subscription?.serviceId) {
      const serviceSnap = await adminDb
        .collection("club_services")
        .doc(subscription.serviceId)
        .get();
      service = snapToData<ClubService>(serviceSnap);
    }

    // Извличане на свързано лице (родител/дете)
    let relatedMember: Member | null = null;
    if (member.relatedMemberId) {
      const relatedSnap = await adminDb
        .collection("members")
        .doc(member.relatedMemberId)
        .get();
      relatedMember = snapToData<Member>(relatedSnap);
    }

    // Извличане на семейство и други членове на семейството
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
        subscription,
        family,
        familyMembers,
      },
    };
  } catch (error: any) {
    console.error("Error getReceiptDetailsServerAction:", error);
    return {
      success: false,
      error:
        error.message || "Грешка при извличане на детайлите за разписката.",
    };
  }
}
