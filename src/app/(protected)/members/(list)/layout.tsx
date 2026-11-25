export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { Suspense } from "react";

import {
  isClubMemberProfile,
  isGuestProfile,
  isRecoveryProfile,
} from "@/components/members/list/member-list-sections";
import {
  MembersNavHeader,
  MembersTabCounts,
} from "@/components/members/list/MembersNavHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import { getAllMembersServer } from "@/services/member-service.server";

export default async function MembersListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let counts: MembersTabCounts | undefined;

  try {
    const cookieStore = await cookies();
    const activeBranch = cookieStore.get("activeBranch")?.value || "bkgalabovo";

    const [members, familiesCount] = await Promise.all([
      getAllMembersServer(),
      serverCache.get(
        `families:count:${activeBranch}`,
        async () => {
          try {
            const adminDb = getAdminDb();
            if (activeBranch === "bkgalabovo") {
              const snap = await adminDb.collection("families").get();
              return snap.docs.filter(
                (d) => d.data()?.siteId !== "recoveryzone"
              ).length;
            }
            const snap = await adminDb
              .collection("families")
              .where("siteId", "==", activeBranch)
              .count()
              .get();
            return snap.data().count;
          } catch {
            return 0;
          }
        },
        3 * 60 * 1000
      ),
    ]);

    counts = {
      all: members.length,
      club: members.filter(isClubMemberProfile).length,
      recovery: members.filter(isRecoveryProfile).length,
      guests: members.filter(isGuestProfile).length,
      families: familiesCount,
    };
  } catch (e) {
    console.error("Failed to load members counts for header:", e);
  }

  return (
    <div className="space-y-3.5">
      <Suspense fallback={<HeaderLoading />}>
        <MembersNavHeader counts={counts} />
      </Suspense>
      {children}
    </div>
  );
}

function HeaderLoading() {
  return (
    <div className="space-y-3 pb-2">
      <Skeleton className="h-14 w-64 rounded-xl" />
      <Skeleton className="h-9 w-96 rounded-xl" />
    </div>
  );
}
