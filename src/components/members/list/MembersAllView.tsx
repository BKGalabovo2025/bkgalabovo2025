"use client";

import { MembersTableComponent } from "@/components/members/list/MembersTableComponent";
import { Member } from "@/types";

interface MembersAllViewProps {
  initialMembers: Member[];
}

export function MembersAllView({ initialMembers }: MembersAllViewProps) {
  return (
    <div className="animate-in fade-in duration-300">
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
