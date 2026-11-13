"use client";

import dynamic from "next/dynamic";
import React from "react";

import { useMemberProfileContext } from "../MemberProfileContext";

const MemberTrainingVolumeTab = dynamic(
  () =>
    import("@/components/members/sections/MemberTrainingVolumeTab").then(
      (mod) => mod.MemberTrainingVolumeTab
    ),
  {
    loading: () => (
      <div className="animate-pulse p-8 text-center text-zinc-500 dark:text-zinc-400">
        Зареждане на тренировъчен обем...
      </div>
    ),
  }
);

export function MemberVolumeTabView() {
  const { memberId } = useMemberProfileContext();

  return <MemberTrainingVolumeTab memberId={memberId} />;
}
