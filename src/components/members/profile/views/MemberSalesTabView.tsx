"use client";

import dynamic from "next/dynamic";
import React from "react";

import { useMemberProfileContext } from "../MemberProfileContext";

const MemberSalesHistory = dynamic(
  () =>
    import("@/components/members/member-sales-history").then(
      (mod) => mod.MemberSalesHistory
    ),
  {
    loading: () => (
      <div className="animate-pulse p-8 text-center text-slate-400">
        Зареждане на финансова история...
      </div>
    ),
  }
);

export function MemberSalesTabView() {
  const { memberId, fullName, familyMembers } = useMemberProfileContext();

  return (
    <MemberSalesHistory
      memberId={memberId}
      memberName={fullName}
      familyMembers={familyMembers}
    />
  );
}
