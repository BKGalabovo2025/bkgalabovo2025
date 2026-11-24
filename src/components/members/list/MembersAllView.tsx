"use client";

import dynamic from "next/dynamic";

import { Member } from "@/types";

const MembersTableComponent = dynamic(() =>
  import("@/components/members/list/MembersTableComponent").then(
    (m) => m.MembersTableComponent
  )
);

interface MembersAllViewProps {
  initialMembers: Member[];
}

export function MembersAllView({ initialMembers }: MembersAllViewProps) {
  return (
    <div>
      <MembersTableComponent
        initialMembers={initialMembers}
        showCategoryBadge={true}
        emptyMessage="Няма намерени членове в общия списък"
        exportFileName="all_members.csv"
        kpiTitle="Всички членове"
      />
    </div>
  );
}
