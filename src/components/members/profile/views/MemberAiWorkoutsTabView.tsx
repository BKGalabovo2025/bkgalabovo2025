"use client";

import dynamic from "next/dynamic";
import React from "react";

import { useMemberProfileContext } from "../MemberProfileContext";

const MemberAiWorkoutsTab = dynamic(
  () =>
    import("@/components/members/sections/MemberAiWorkoutsTab").then(
      (mod) => mod.MemberAiWorkoutsTab
    ),
  {
    loading: () => (
      <div className="animate-pulse p-8 text-center text-slate-400">
        Зареждане на AI програми...
      </div>
    ),
  }
);

export function MemberAiWorkoutsTabView() {
  const { memberId, member, setIsAiWorkoutModalOpen } =
    useMemberProfileContext();

  return (
    <MemberAiWorkoutsTab
      memberId={memberId}
      memberName={member.name}
      onOpenGenerator={() => setIsAiWorkoutModalOpen(true)}
    />
  );
}
