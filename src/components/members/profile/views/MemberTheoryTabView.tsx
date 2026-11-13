"use client";

import dynamic from "next/dynamic";
import React from "react";

import { useMemberProfileContext } from "../MemberProfileContext";

const MemberTheoryTab = dynamic(
  () =>
    import("@/components/members/sections/MemberTheoryTab").then(
      (mod) => mod.MemberTheoryTab
    ),
  {
    loading: () => (
      <div className="animate-pulse p-8 text-center text-zinc-500 dark:text-zinc-400">
        Зареждане на тестове...
      </div>
    ),
  }
);

export function MemberTheoryTabView() {
  const { memberId } = useMemberProfileContext();

  return <MemberTheoryTab memberId={memberId} />;
}
