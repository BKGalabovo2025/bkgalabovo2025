"use client";

import dynamic from "next/dynamic";
import React from "react";

import { useMemberProfileContext } from "../MemberProfileContext";

const MemberAttendanceHistory = dynamic(
  () =>
    import("@/components/members/MemberAttendanceHistory").then(
      (mod) => mod.MemberAttendanceHistory
    ),
  {
    loading: () => (
      <div className="animate-pulse p-8 text-center text-slate-400">
        Зареждане на присъствия...
      </div>
    ),
  }
);

export function MemberAttendanceTabView() {
  const { memberId } = useMemberProfileContext();

  return <MemberAttendanceHistory memberId={memberId} />;
}
