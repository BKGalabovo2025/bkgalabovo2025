"use client";

import React from "react";

import { MemberAssessmentsTab } from "@/components/members/tabs/MemberAssessmentsTab";

import { useMemberProfileContext } from "../MemberProfileContext";

export function MemberAssessmentsTabView() {
  const { memberId } = useMemberProfileContext();

  return <MemberAssessmentsTab memberId={memberId} />;
}
