"use client";

import { UserCheck, UserMinus, Users } from "lucide-react";
import { useMemo } from "react";

import { MembersTableComponent } from "@/components/members/list/MembersTableComponent";
import { Member } from "@/types";

interface MembersClubViewProps {
  initialMembers: Member[];
}

export function MembersClubView({ initialMembers }: MembersClubViewProps) {
  const clubMembers = useMemo(() => {
    return initialMembers.filter(
      (m) =>
        m.isClubMember === true ||
        (!m.isGuest && m.memberType === "regular" && !m.isRecoveryMember)
    );
  }, [initialMembers]);

  const stats = useMemo(() => {
    return {
      total: clubMembers.length,
      active: clubMembers.filter((m) => m.status === "active").length,
      inactive: clubMembers.filter((m) => m.status === "inactive").length,
    };
  }, [clubMembers]);

  return (
    <div className="space-y-3.5 animate-in fade-in">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-white p-2.5 sm:gap-3 sm:p-3 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="shrink-0 rounded-lg bg-primary/5 p-1.5 text-primary sm:p-2">
            <Users className="size-4" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium tracking-wider text-zinc-500 uppercase sm:text-[11px] dark:text-zinc-400">
              Клубни членове
            </p>
            <p className="text-lg font-bold text-zinc-900 sm:text-2xl dark:text-white">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-zinc-100 bg-white p-3 sm:gap-3.5 sm:p-4 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="shrink-0 rounded-xl bg-emerald-500/5 p-2 text-emerald-600 sm:p-2.5">
            <UserCheck className="size-4 sm:size-5" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium tracking-wider text-zinc-500 uppercase sm:text-[11px] dark:text-zinc-400">
              Активни
            </p>
            <p className="text-lg font-bold text-emerald-600 sm:text-2xl">
              {stats.active}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-zinc-100 bg-white p-3 sm:gap-3.5 sm:p-4 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="shrink-0 rounded-xl bg-rose-500/5 p-2 text-rose-600 sm:p-2.5">
            <UserMinus className="size-4 sm:size-5" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium tracking-wider text-zinc-500 uppercase sm:text-[11px] dark:text-zinc-400">
              Неактивни
            </p>
            <p className="text-lg font-bold text-rose-600 sm:text-2xl">
              {stats.inactive}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <MembersTableComponent
        initialMembers={clubMembers}
        showCategoryBadge={false}
        emptyMessage="Няма намерени клубни членове"
        exportFileName="club_members.csv"
      />
    </div>
  );
}
