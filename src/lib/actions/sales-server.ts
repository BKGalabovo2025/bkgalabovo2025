/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { Sale, Member, ClubService, Family } from "@/types";
import { getCachedSalesForBranch } from "@/lib/db/sales";

// РџРѕРјРѕС‰РЅР° С„СѓРЅРєС†РёСЏ Р·Р° РїСЂРµРѕР±СЂР°Р·СѓРІР°РЅРµ РЅР° Firestore РґРѕРєСѓРјРµРЅС‚Рё СЃ РєРѕРЅРІРµСЂС‚РёСЂР°РЅРµ РЅР° Timestamps РІ ISO РЅРёР·РѕРІРµ
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
 * РР·РІР»РёС‡Р° РІСЃРёС‡РєРё РїСЂРѕРґР°Р¶Р±Рё РЅР° СЃСЉСЂРІСЉСЂР°.
 */
export async function getInventorySalesServerAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      throw new Error("РќРµРѕС‚РѕСЂРёР·РёСЂР°РЅ РґРѕСЃС‚СЉРї.");
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
        "Р“СЂРµС€РєР° РїСЂРё РёР·РІР»РёС‡Р°РЅРµ РЅР° РїСЂРѕРґР°Р¶Р±РёС‚Рµ.",
    };
  }
}

/**
 * Р˜Р·РІР»РёС‡Р° РїСЉР»РЅРёС‚Рµ РґРµС‚Р°Р№Р»Рё РїРѕ СЂР°Р·РїРёСЃРєР° РЅР° СЃСЉСЂРІСЉСЂР°.
 */
/* eslint-disable sonarjs/cognitive-complexity */
export async function getReceiptDetailsServerAction(saleId: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      throw new Error("РќРµРѕС‚РѕСЂРёР·РёСЂР°РЅ РґРѕСЃС‚СЉРї.");
    }

    const adminDb = getAdminDb();
    const saleSnap = await adminDb.collection("sales").doc(saleId).get();

    if (!saleSnap.exists) {
      return {
        success: false,
        error: "РџСЂРѕРґР°Р¶Р±Р°С‚Р° РЅРµ Рµ РЅР°РјРµСЂРµРЅР°.",
      };
    }

    const sale = snapToData<Sale>(saleSnap);
    if (!sale) {
      console.error("Sale data is incomplete:", sale);
      return {
        success: false,
        error: "РќРµРїСЉР»РЅРё РґР°РЅРЅРё Р·Р° РїСЂРѕРґР°Р¶Р±Р°С‚Р°.",
      };
    }

    const isGuest = sale.memberId === "GUEST_EXTERNAL";
    const isWalkIn = !sale.memberId || sale.memberId === "Walk-in Customer";
    const shouldFetchMember = !isGuest && !isWalkIn && sale.memberId;

    // РџР°СЂР°Р»РµР»РЅРѕ РёР·РІР»РёС‡Р°РЅРµ РЅР° РѕСЃРЅРѕРІРЅРёС‚Рµ СЃРІСЉСЂР·Р°РЅРё РґРѕРєСѓРјРµРЅС‚Рё
    const memberSnap = shouldFetchMember
      ? await adminDb.collection("members").doc(sale.memberId).get()
      : null;

    let member =
      memberSnap && memberSnap.exists ? snapToData<Member>(memberSnap) : null;

    if (!member) {
      if (sale.memberId === "GUEST_EXTERNAL") {
        member = {
          id: "GUEST_EXTERNAL",
          firstName: "Р’СЉРЅС€РµРЅ",
          lastName: "РіРѕСЃС‚",
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
          firstName: "Р’СЉРЅС€РµРЅ",
          lastName: "РєР»РёРµРЅС‚",
          email: "",
          phone: "",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          siteId: sale.siteId || "bkgalabovo",
        } as unknown as Member;
      }
    }

    // РР·РІР»РёС‡Р°РЅРµ РЅР° СЃРІСЉСЂР·Р°РЅР° СѓСЃР»СѓРіР° (Р°РєРѕ Рµ РЅРµРѕР±С…РѕРґРёРјРѕ)
    const service: ClubService | null = null;

    // РР·РІР»РёС‡Р°РЅРµ РЅР° СЃРІСЉСЂР·Р°РЅРѕ Р»РёС†Рµ (СЂРѕРґРёС‚РµР»/РґРµС‚Рµ)
    let relatedMember: Member | null = null;
    if (member.relatedMemberId) {
      const relatedSnap = await adminDb
        .collection("members")
        .doc(member.relatedMemberId)
        .get();
      relatedMember = snapToData<Member>(relatedSnap);
    }

    // РР·РІР»РёС‡Р°РЅРµ РЅР° СЃРµРјРµР№СЃС‚РІРѕ Рё РґСЂСѓРіРё С‡Р»РµРЅРѕРІРµ РЅР° СЃРµРјРµР№СЃС‚РІРѕС‚Рѕ
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
          // Р’Р·РёРјР°РјРµ РѕСЃС‚Р°РЅР°Р»РёС‚Рµ С‡Р»РµРЅРѕРІРµ РЅР° СЃРµРјРµР№СЃС‚РІРѕС‚Рѕ
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
        "Р“СЂРµС€РєР° РїСЂРё РёР·РІР»РёС‡Р°РЅРµ РЅР° РґРµС‚Р°Р№Р»РёС‚Рµ Р·Р° СЂР°Р·РїРёСЃРєР°С‚Р°.",
    };
  }
}
