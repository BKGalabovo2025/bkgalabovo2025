"use client";

import { RecoveryClientsList } from "@/components/finances/RecoveryClientsList";
import { BentoCard } from "@/components/ui/bento-card";
import { Member } from "@/types";

interface MembersRecoveryViewProps {
  initialMembers: Member[];
}

export function MembersRecoveryView({
  initialMembers,
}: MembersRecoveryViewProps) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <RecoveryClientsList members={initialMembers} />
      </BentoCard>
    </div>
  );
}
