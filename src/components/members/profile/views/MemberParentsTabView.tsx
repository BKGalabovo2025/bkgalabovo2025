"use client";

import dynamic from "next/dynamic";
import React from "react";

import { useMemberProfileContext } from "../MemberProfileContext";

const MemberParentsTab = dynamic(
  () =>
    import("@/components/members/sections/MemberParentsTab").then(
      (mod) => mod.MemberParentsTab
    ),
  {
    loading: () => (
      <div className="animate-pulse p-8 text-center text-zinc-500 dark:text-zinc-400">
        Зареждане на данни за родители...
      </div>
    ),
  }
);

export function MemberParentsTabView() {
  const { member, refetch } = useMemberProfileContext();

  return <MemberParentsTab member={member} onUpdate={refetch} />;
}
