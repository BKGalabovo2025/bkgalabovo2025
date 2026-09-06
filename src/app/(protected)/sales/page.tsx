import * as admin from "firebase-admin";
import { cookies } from "next/headers";

import { getCachedSalesForBranch } from "@/lib/db/sales";
import { getAdminDb } from "@/lib/firebase-admin";
import { Member, Sale } from "@/types";

import SalesClient from "./SalesClient";

export const dynamic = "force-dynamic";

function snapToMember(
  doc: admin.firestore.DocumentSnapshot | admin.firestore.QueryDocumentSnapshot
): Member | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const convertTimestamps = (val: unknown): unknown => {
    if (!val) return val;
    if (typeof (val as { toDate?: unknown }).toDate === "function") {
      return (val as admin.firestore.Timestamp).toDate().toISOString();
    }
    if (val instanceof admin.firestore.Timestamp) {
      return val.toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    if (typeof val === "object") {
      const copy: Record<string, unknown> = {};
      for (const key of Object.keys(val)) {
        copy[key] = convertTimestamps((val as Record<string, unknown>)[key]);
      }
      return copy;
    }
    return val;
  };

  return {
    id: doc.id,
    ...(convertTimestamps(data) as Record<string, unknown>),
  } as Member;
}

export default async function SalesListPage() {
  const cookieStore = await cookies();
  const activeBranch = cookieStore.get("activeBranch")?.value || "bkgalabovo";

  const adminDb = getAdminDb();
  let membersQuery: admin.firestore.Query = adminDb.collection("members");
  if (activeBranch && activeBranch !== "bkgalabovo") {
    membersQuery = membersQuery.where("siteId", "==", activeBranch);
  }

  let initialSales: Sale[] = [];
  let initialMembers: Member[] = [];

  try {
    const [salesResult, membersSnap] = await Promise.all([
      getCachedSalesForBranch(activeBranch),
      membersQuery.get(),
    ]);
    initialSales = salesResult || [];
    initialMembers = membersSnap.docs
      .map(snapToMember)
      .filter((m): m is Member => m !== null);
  } catch (error) {
    console.error("Failed to load initial sales/members:", error);
  }

  return (
    <div className="pb-12">
      <SalesClient
        initialSales={initialSales}
        initialMembers={initialMembers}
      />
    </div>
  );
}
