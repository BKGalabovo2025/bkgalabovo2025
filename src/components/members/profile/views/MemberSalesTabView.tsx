"use client";

import React from "react";

import { MemberSalesHistory } from "@/components/members/member-sales-history";

import { useMemberProfileContext } from "../MemberProfileContext";

export function MemberSalesTabView() {
  const { memberId, fullName, familyMembers, refetch } =
    useMemberProfileContext();

  return (
    <MemberSalesHistory
      memberId={memberId}
      memberName={fullName}
      familyMembers={familyMembers}
      onDataChanged={refetch}
    />
  );
}
