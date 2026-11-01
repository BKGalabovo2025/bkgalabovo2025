export const dynamic = "force-dynamic";

import { Suspense } from "react";

import {
  MembersNavHeader,
  MembersTabCounts,
} from "@/components/members/list/MembersNavHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllMembersServer } from "@/services/member-service.server";

export default async function MembersListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let counts: MembersTabCounts | undefined;

  try {
    const members = await getAllMembersServer();
    counts = {
      all: members.length,
      club: members.filter(
        (m) =>
          m.isClubMember === true ||
          (!m.isGuest && m.memberType === "regular" && !m.isRecoveryMember)
      ).length,
      recovery: members.filter(
        (m) => m.isRecoveryMember || m.memberType === "recovery"
      ).length,
      guests: members.filter((m) => m.isGuest || m.memberType === "guest")
        .length,
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
