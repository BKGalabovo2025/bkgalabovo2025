"use client";

import React from "react";

import { MemberDocumentsTab } from "@/components/members/tabs/MemberDocumentsTab";

import { useMemberProfileContext } from "../MemberProfileContext";

export function MemberDocumentsTabView() {
  const { member, formatDocDate, updateDocumentStatus } =
    useMemberProfileContext();

  return (
    <MemberDocumentsTab
      member={member}
      formatDocDate={formatDocDate}
      updateDocumentStatus={updateDocumentStatus}
    />
  );
}
