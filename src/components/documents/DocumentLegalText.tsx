"use client";

import React from "react";

import { OfficialDocumentRenderer } from "./OfficialDocumentRenderer";

export interface DocumentLegalTextProps {
  documentType: string;
  memberName: string;
  memberBirthDate?: string | null;
  participationType?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentAddress?: string | null;
}

export function isMatchingParticipation(
  selected: string | null | undefined,
  option: string
): boolean {
  if (!selected) return false;
  const s = selected.toLowerCase().replace(/–|-/g, "-").trim();
  const o = option.toLowerCase().replace(/–|-/g, "-").trim();
  if (s === o) return true;
  if (
    o.includes("1 дете") &&
    (s.includes("1 дете") || s.includes("едно дете") || s.includes("1-но дете"))
  )
    return true;
  if (
    o.includes("2 деца") &&
    !o.includes("2+") &&
    s.includes("2 деца") &&
    !s.includes("2+")
  )
    return true;
  if (o.includes("2+") && (s.includes("2+") || s.includes("повече от 2")))
    return true;
  if (o.includes("единично") && (s.includes("единично") || s.includes("3 eur")))
    return true;
  return false;
}

export function DocumentLegalText({
  documentType,
  memberName,
  memberBirthDate,
  participationType,
  parentName,
  parentPhone,
  parentEmail,
  parentAddress,
}: DocumentLegalTextProps) {
  return (
    <OfficialDocumentRenderer
      slug={documentType}
      memberName={memberName}
      memberBirthDate={memberBirthDate}
      participationType={participationType}
      parentName={parentName}
      parentPhone={parentPhone}
      parentEmail={parentEmail}
      parentAddress={parentAddress}
      isPrintMode={false}
    />
  );
}
