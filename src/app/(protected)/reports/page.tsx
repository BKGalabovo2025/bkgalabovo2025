import ReportsClient from "./ReportsClient";
import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { getCachedSalesForBranch } from "@/lib/db/sales";
import { serverCache } from "@/lib/server-cache";
import { Member, Product, ScheduleEvent } from "@/types";

export const dynamic = "force-dynamic";

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

function snapToData<T>(
  doc: admin.firestore.DocumentSnapshot | admin.firestore.QueryDocumentSnapshot
): T | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    ...convertTimestamps(data),
  } as T;
}

export default async function ReportsPage() {
  const cookieStore = await cookies();
  const activeBranch = cookieStore.get("activeBranch")?.value || "bkgalabovo";

  const adminDb = getAdminDb();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all necessary data parallelly using Admin SDK & server-side cache
  const [sales, members, events, products] = await Promise.all([
    // 1. Fetch Sales using existing cached helper
    getCachedSalesForBranch(activeBranch),

    // 2. Fetch Members using cached helper
    serverCache.get<Member[]>(
      `members:${activeBranch || "all"}`,
      async () => {
        let membersQuery: admin.firestore.Query = adminDb.collection("members");
        if (activeBranch && activeBranch !== "bkgalabovo") {
          membersQuery = membersQuery.where("siteId", "==", activeBranch);
        }
        const snap = await membersQuery.get();
        return snap.docs
          .map((doc) => snapToData<Member>(doc))
          .filter((m): m is Member => m !== null);
      },
      60000 // 60s cache
    ),

    // 3. Fetch Events for the current month
    serverCache.get<ScheduleEvent[]>(
      `events:${activeBranch || "all"}:${startOfMonth.toISOString()}:${now.toISOString()}`,
      async () => {
        let eventsQuery: admin.firestore.Query = adminDb
          .collection("events")
          .where("startDate", ">=", startOfMonth.toISOString())
          .where("startDate", "<=", now.toISOString());
        if (activeBranch && activeBranch !== "bkgalabovo") {
          eventsQuery = eventsQuery.where("siteId", "==", activeBranch);
        }
        const snap = await eventsQuery.get();
        return snap.docs
          .map((doc) => snapToData<ScheduleEvent>(doc))
          .filter((e): e is ScheduleEvent => e !== null);
      },
      30000 // 30s cache
    ),

    // 4. Fetch Products for minStock checks
    serverCache.get<Product[]>(
      `products:${activeBranch || "all"}`,
      async () => {
        let productsQuery: admin.firestore.Query =
          adminDb.collection("products");
        if (activeBranch && activeBranch !== "bkgalabovo") {
          productsQuery = productsQuery.where("siteId", "==", activeBranch);
        }
        const snap = await productsQuery.get();
        return snap.docs
          .map((doc) => snapToData<Product>(doc))
          .filter((p): p is Product => p !== null);
      },
      60000 // 60s cache
    ),
  ]);

  // 1. In-memory Calculation for Liabilities (Unpaid members)
  // Get all members who paid for the current month
  const salesForMonth = sales.filter((sale) => {
    const saleDate = new Date(sale.saleDate);
    return (
      saleDate.getFullYear() === currentYear &&
      saleDate.getMonth() === currentMonth - 1 &&
      sale.isPaid
    );
  });
  const paidMemberIds = new Set(salesForMonth.map((s) => s.memberId));
  // Unpaid members are those not in paidMemberIds
  const unpaidMembers = members.filter(
    (member) => !paidMemberIds.has(member.id)
  );

  // 2. In-memory Calculation for Attendance Report
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const attendanceByMember: { [memberId: string]: number } = {};

  for (const event of events) {
    const attendees = Array.isArray(event.attendees) ? event.attendees : [];
    for (const attendee of attendees) {
      if (attendee.attended) {
        if (!attendanceByMember[attendee.memberId]) {
          attendanceByMember[attendee.memberId] = 0;
        }
        attendanceByMember[attendee.memberId]++;
      }
    }
  }

  const attendanceReport = Object.keys(attendanceByMember)
    .map((memberId) => {
      const member = memberMap.get(memberId);
      if (!member) {
        return {
          member: {
            id: memberId,
            siteId: activeBranch,
            firstName: "Неизвестен",
            lastName: "Член",
            name: "Неизвестен Член",
            email: "",
            phone: "",
            instagram: "",
            dateOfBirth: "",
            subscriptionStatus: "inactive",
            status: "inactive",
            registrationDate: new Date().toISOString(),
            notes: "",
            role: "member",
          } as Member,
          attendanceCount: attendanceByMember[memberId],
        };
      }
      return {
        member,
        attendanceCount: attendanceByMember[memberId],
      };
    })
    .sort((a, b) => b.attendanceCount - a.attendanceCount);

  // 3. In-memory Calculation for Restock list
  const productsToRestock = products.filter(
    (p) =>
      typeof p.restockThreshold === "number" && p.stock <= p.restockThreshold
  );

  return (
    <ReportsClient
      initialSales={sales}
      initialMembers={members}
      initialLiabilities={unpaidMembers}
      initialLiabilitiesPeriod={{ year: currentYear, month: currentMonth }}
      initialAttendanceData={attendanceReport}
      initialAttendancePeriod={{
        startDate: startOfMonth.toISOString(),
        endDate: now.toISOString(),
      }}
      initialRestockProducts={productsToRestock}
    />
  );
}
