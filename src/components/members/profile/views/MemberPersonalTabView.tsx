"use client";

import React from "react";

import { MemberPersonalTab } from "@/components/members/sections/MemberPersonalTab";

import { useMemberProfileContext } from "../MemberProfileContext";

export function MemberPersonalTabView() {
  const {
    member,
    familyMembers,
    ageGroup,
    formattedBirthDate,
    formattedRegistrationDate,
    formatPhoneType,
  } = useMemberProfileContext();

  return (
    <MemberPersonalTab
      member={member}
      familyMembers={familyMembers}
      ageGroup={ageGroup}
      formattedBirthDate={formattedBirthDate}
      formattedRegistrationDate={formattedRegistrationDate}
      formatPhoneType={formatPhoneType}
    />
  );
}
