import { cookies } from "next/headers";
import { getInventorySalesServerAction } from "@/lib/actions/sales-server";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import SalesClient from "./SalesClient";

export const dynamic = "force-dynamic";

export default async function SalesListPage() {
  const cookieStore = await cookies();
  const activeBranch = cookieStore.get("activeBranch")?.value || "bkgalabovo";

  // Сървърно извличане на продажбите
  const salesResult = await getInventorySalesServerAction(activeBranch);
  const initialSales = salesResult.success ? salesResult.data || [] : [];

  // Сървърно извличане на членовете за мапиране на имена
  const adminDb = getAdminDb();
  let membersQuery: admin.firestore.Query = adminDb.collection("members");
  if (activeBranch && activeBranch !== "bkgalabovo") {
    membersQuery = membersQuery.where("siteId", "==", activeBranch);
  }
  const membersSnap = await membersQuery.get();

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

  const initialMembers = membersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...convertTimestamps(data),
    };
  });

  return (
    <div className="pb-12">
      <SalesClient
        initialSales={initialSales}
        initialMembers={initialMembers}
      />
    </div>
  );
}
