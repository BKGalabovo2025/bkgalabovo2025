"use client";

import dynamic from "next/dynamic";
import React from "react";

import { useMemberProfileContext } from "../MemberProfileContext";

const MemberTheoryTab = dynamic(
  () =>
    import("@/components/members/tabs/MemberTheoryTab").then(
      (mod) => mod.MemberTheoryTab
    ),
  {
    loading: () => (
      <div className="animate-pulse p-8 text-center text-slate-400">
        Зареждане на тестове...
      </div>
    ),
  }
);

export function MemberTheoryTabView() {
  const { memberId } = useMemberProfileContext();

  return <MemberTheoryTab memberId={memberId} />;
}
