"use client";

import React from "react";

import { MemberAssessmentsTab } from "@/components/members/sections/MemberAssessmentsTab";

import { useMemberProfileContext } from "../MemberProfileContext";

export function MemberAssessmentsTabView() {
  const { memberId, member, fullName } = useMemberProfileContext();

  return (
    <MemberAssessmentsTab
      memberId={memberId}
      birthDate={member.dateOfBirth}
      memberName={fullName}
    />
  );
}
