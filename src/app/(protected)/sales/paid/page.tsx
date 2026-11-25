import type { Metadata } from "next";
import { cookies } from "next/headers";

import { getCachedSalesForBranch } from "@/lib/db/sales";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member, Sale } from "@/types";

import SalesClient from "../SalesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Платени продажби | Продажби - БК Гълъбово",
  description: "Всички платени продажби, фактури и касови бележки.",
};

export default async function PaidSalesPage() {
  const cookieStore = await cookies();
  const activeBranch = cookieStore.get("activeBranch")?.value || "bkgalabovo";

  let initialSales: Sale[] = [];
  let initialMembers: Member[] = [];

  try {
    const [salesResult, membersResult] = await Promise.all([
      getCachedSalesForBranch(activeBranch),
      getAllMembersServer(
        activeBranch && activeBranch !== "bkgalabovo" ? activeBranch : undefined
      ),
    ]);
    initialSales = salesResult || [];
    initialMembers = (membersResult || [])
      .filter(
        (m) => !(activeBranch === "bkgalabovo" && m.siteId === "recoveryzone")
      )
      .map(
        (m) =>
          ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
          }) as Member
      );
  } catch (error) {
    console.error("Failed to load initial paid sales/members:", error);
  }

  return (
    <div className="pb-12">
      <SalesClient
        initialSales={initialSales}
        initialMembers={initialMembers}
        section="paid"
      />
    </div>
  );
}
