"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { Family, useMemberProfile } from "@/hooks/useMemberProfile";
import { updateMemberAction } from "@/lib/actions/members";
import { checkIsMemberOverdue } from "@/lib/membership-utils";
import {
  formatFullName,
  getAgeGroup,
  getInitials,
  getValidAvatarUrl,
} from "@/lib/utils";
import { Member, Sale, ScheduleEvent } from "@/types";

export type DocumentField =
  | "signedDeclaration"
  | "medicalCertificate"
  | "isLicensed"
  | "travelDeclaration"
  | "safetyInstruction"
  | "internalRules"
  | "membershipApplication"
  | "terminationRequest"
  | "amateurContract"
  | "licenseApplication";

export interface MemberProfileContextType {
  memberId: string;
  member: Member;
  family: Family | null;
  familyMembers: Member[];
  sales: Sale[];
  attendances: ScheduleEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
  isAiWorkoutModalOpen: boolean;
  setIsAiWorkoutModalOpen: (open: boolean) => void;
  updateDocumentStatus: (
    baseField: DocumentField,
    action: "print" | "submit" | "cancel"
  ) => Promise<void>;
  fullName: string;
  ageGroup: string | null;
  formattedBirthDate: string | null;
  formattedRegistrationDate: string | null;
  formatPhoneType: (phoneType: string | null | undefined) => string | null;
  formatDocDate: (isoString: string | null | undefined) => string | null;
  isOverdue: boolean;
  overdueReason: string | null;
  lastPayment: Date | null;
  avatarUrl?: string;
  initials: string;
}

const MemberProfileContext = createContext<MemberProfileContextType | null>(
  null
);

export interface MemberProfileProviderProps {
  memberId: string;
  initialData: {
    member: Member;
    family: Family | null;
    familyMembers: Member[];
    attendances: ScheduleEvent[];
    sales: Sale[];
  };
  children: React.ReactNode;
}

export function MemberProfileProvider({
  memberId,
  initialData,
  children,
}: MemberProfileProviderProps) {
  const router = useRouter();
  const { idToken } = useAuth();
  const [isAiWorkoutModalOpen, setIsAiWorkoutModalOpen] = useState(false);

  const {
    member,
    family,
    familyMembers,
    sales,
    attendances,
    loading,
    error,
    refetch,
  } = useMemberProfile(memberId, initialData);

  const activeMember = member || initialData.member;
  const activeFamilyMembers =
    familyMembers.length > 0 ? familyMembers : initialData.familyMembers;
  const activeSales = sales.length > 0 ? sales : initialData.sales;
  const activeFamily = family || initialData.family;
  const activeAttendances =
    attendances.length > 0 ? attendances : initialData.attendances;

  const fullName = formatFullName(activeMember);
  const ageGroup = activeMember.dateOfBirth
    ? getAgeGroup(activeMember.dateOfBirth)
    : null;
  const formattedBirthDate = activeMember.dateOfBirth
    ? new Date(activeMember.dateOfBirth).toLocaleDateString("bg-BG")
    : null;
  const formattedRegistrationDate = activeMember.registrationDate
    ? new Date(activeMember.registrationDate).toLocaleDateString("bg-BG")
    : null;

  const { isOverdue, reason: overdueReason } = checkIsMemberOverdue(
    activeMember,
    activeFamilyMembers,
    activeSales
  );

  const latestSaleDate = (() => {
    const completedSales = activeSales.filter(
      (s) =>
        s.memberId === activeMember.id && s.isPaid && s.status === "completed"
    );
    if (completedSales.length === 0) return null;
    completedSales.sort(
      (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
    );
    return new Date(completedSales[0].saleDate);
  })();

  const formatPhoneType = (phoneType: string | null | undefined) => {
    if (!phoneType) return null;
    return phoneType === "personal" ? "Личен" : "На родител";
  };

  const formatDocDate = (isoString: string | null | undefined) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const updateDocumentStatus = async (
    baseField: DocumentField,
    action: "print" | "submit" | "cancel"
  ) => {
    if (!idToken) return;

    const updates: Record<string, string | boolean | null> = {};
    const now = new Date().toISOString();

    const boolField =
      baseField === "isLicensed"
        ? "isLicensed"
        : `has${baseField.charAt(0).toUpperCase()}${baseField.slice(1)}`;
    const printedField = `${baseField}PrintedAt`;
    const handedField = `${baseField}HandedAt`;

    if (action === "print") {
      updates[printedField] = now;
    } else if (action === "submit") {
      updates[boolField] = true;
      updates[handedField] = now;
    } else if (action === "cancel") {
      updates[boolField] = false;
      updates[handedField] = null;
    }

    try {
      const result = await updateMemberAction(
        activeMember.id,
        idToken,
        updates
      );
      if (result.success) {
        if (action !== "print") toast.success("Статусът е обновен успешно!");
        await refetch();
        router.refresh();
      } else {
        toast.error("Възникна грешка", { description: result.message });
      }
    } catch (err) {
      console.error("Error updating document status:", err);
      toast.error("Грешка при обновяване");
    }
  };

  const avatarUrl = getValidAvatarUrl(activeMember.avatarUrl);
  const initials = getInitials(fullName);

  return (
    <MemberProfileContext.Provider
      value={{
        memberId,
        member: activeMember,
        family: activeFamily,
        familyMembers: activeFamilyMembers,
        sales: activeSales,
        attendances: activeAttendances,
        loading,
        error,
        refetch,
        isAiWorkoutModalOpen,
        setIsAiWorkoutModalOpen,
        updateDocumentStatus,
        fullName,
        ageGroup,
        formattedBirthDate,
        formattedRegistrationDate,
        formatPhoneType,
        formatDocDate,
        isOverdue,
        overdueReason,
        lastPayment: latestSaleDate,
        avatarUrl,
        initials,
      }}
    >
      {children}
    </MemberProfileContext.Provider>
  );
}

export function useMemberProfileContext() {
  const context = useContext(MemberProfileContext);
  if (!context) {
    throw new Error(
      "useMemberProfileContext must be used within a MemberProfileProvider"
    );
  }
  return context;
}
