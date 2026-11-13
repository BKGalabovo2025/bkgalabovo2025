"use client";

import dynamic from "next/dynamic";
import React from "react";

import { useMemberProfileContext } from "../MemberProfileContext";

const MemberTrainingsHistory = dynamic(
  () =>
    import("@/components/members/MemberTrainingsHistory").then(
      (mod) => mod.MemberTrainingsHistory
    ),
  {
    loading: () => (
      <div className="animate-pulse p-8 text-center text-zinc-500 dark:text-zinc-400">
        Зареждане на тренировки...
      </div>
    ),
  }
);

export function MemberTrainingsTabView() {
  const { memberId } = useMemberProfileContext();

  return <MemberTrainingsHistory memberId={memberId} />;
}
