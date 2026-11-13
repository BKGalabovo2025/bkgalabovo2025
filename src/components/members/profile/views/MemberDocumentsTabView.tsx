"use client";

import React from "react";

import { MemberDocumentsTab } from "@/components/members/sections/MemberDocumentsTab";

import { useMemberProfileContext } from "../MemberProfileContext";

export function MemberDocumentsTabView() {
  const { member, formatDocDate, updateDocumentStatus, refetch } =
    useMemberProfileContext();

  return (
    <MemberDocumentsTab
      member={member}
      formatDocDate={formatDocDate}
      updateDocumentStatus={updateDocumentStatus}
      onRefresh={refetch}
    />
  );
}
