"use client";

import { useMemo } from "react";

import { isClubMemberProfile } from "@/components/members/list/member-list-sections";
import { MembersTableComponent } from "@/components/members/list/MembersTableComponent";
import { Member } from "@/types";

interface MembersClubViewProps {
  initialMembers: Member[];
}

export function MembersClubView({ initialMembers }: MembersClubViewProps) {
  const clubMembers = useMemo(() => {
    return initialMembers.filter(isClubMemberProfile);
  }, [initialMembers]);

  return (
    <div className="animate-in fade-in duration-300">
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
