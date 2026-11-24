"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { isClubMemberProfile } from "@/components/members/list/member-list-sections";
import { Member } from "@/types";

const MembersTableComponent = dynamic(() =>
  import("@/components/members/list/MembersTableComponent").then(
    (m) => m.MembersTableComponent
  )
);

interface MembersClubViewProps {
  initialMembers: Member[];
}

export function MembersClubView({ initialMembers }: MembersClubViewProps) {
  const clubMembers = useMemo(() => {
    return initialMembers.filter(isClubMemberProfile);
  }, [initialMembers]);

  return (
    <div>
      <MembersTableComponent
        initialMembers={clubMembers}
        showCategoryBadge={false}
        emptyMessage="Няма намерени картотекирани клубни членове"
        exportFileName="club_members.csv"
        kpiTitle="Клубни членове"
      />
    </div>
  );
}
