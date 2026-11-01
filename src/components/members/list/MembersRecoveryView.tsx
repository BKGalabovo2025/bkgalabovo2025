"use client";

import { RecoveryClientsList } from "@/components/finances/RecoveryClientsList";
import { Member } from "@/types";

interface MembersRecoveryViewProps {
  initialMembers: Member[];
}

export function MembersRecoveryView({
  initialMembers,
}: MembersRecoveryViewProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <RecoveryClientsList members={initialMembers} />
    </div>
  );
}
