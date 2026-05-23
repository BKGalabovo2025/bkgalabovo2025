import { cookies } from "next/headers";
import { PageHeader } from "@/components/layout/page-header";
import { getFinancesOverviewDataAction } from "@/lib/actions/finances-server";
import { getInventorySalesServerAction } from "@/lib/actions/sales-server";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import FinancesClient from "./FinancesClient";
import { serverCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

// Helper to convert Firestore timestamps inside objects into ISO strings for client compatibility
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

export default async function FinancesPage() {
  const cookieStore = await cookies();
  const activeBranch = cookieStore.get("activeBranch")?.value || "bkgalabovo";

  const adminDb = getAdminDb();

  // Parallel fetch of all essential finance data using in-memory cache helpers
  const [financesResult, salesResult, initialMembers] = await Promise.all([
    getFinancesOverviewDataAction(activeBranch),
    getInventorySalesServerAction(activeBranch),
    serverCache.get(
      `members:${activeBranch || "all"}`,
      async () => {
        let membersQuery: admin.firestore.Query = adminDb.collection("members");
        if (activeBranch && activeBranch !== "bkgalabovo") {
          membersQuery = membersQuery.where("siteId", "==", activeBranch);
        }
        // Use select projection to minimize firestore read payload
        const snap = await membersQuery
          .select("firstName", "lastName", "siteId")
          .get();
        return snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...convertTimestamps(data),
          };
        });
      },
      60000 // 60 seconds members cache TTL
    ),
  ]);

  // 1. Finances Dashboard Stats
  const financesData =
    financesResult.success && financesResult.data
      ? financesResult.data
      : {
          dailyTrend: [],
          categories: [
            { name: "Няма продажби", value: 0.01, color: "#e4e4e7" },
          ],
          totalRevenue: 0,
          transactionCount: 0,
          averageTransactionValue: 0,
        };

  // 2. Initial Sales list
  const initialSales = salesResult.success ? salesResult.data || [] : [];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <PageHeader
        title="Център за Управление"
        description="Единно работно пространство за управление на абонаменти, плащания, хроника на транзакциите и наличности на склад."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Управление" },
        ]}
      />

      <FinancesClient
        initialSales={initialSales}
        initialMembers={initialMembers}
        financesData={financesData}
      />
    </div>
  );
}
