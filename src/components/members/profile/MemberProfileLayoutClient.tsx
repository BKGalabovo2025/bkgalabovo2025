"use client";

import React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { AiWorkoutGeneratorModal } from "@/components/training/AiWorkoutGeneratorModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Family } from "@/hooks/useMemberProfile";
import { Member, Sale, ScheduleEvent } from "@/types";

import {
  MemberProfileProvider,
  useMemberProfileContext,
} from "./MemberProfileContext";
import { MemberProfileHeader } from "./MemberProfileHeader";
import { MemberProfileNav } from "./MemberProfileNav";

interface MemberProfileLayoutClientProps {
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

function MemberProfileInner({ children }: { children: React.ReactNode }) {
  const {
    member,
    fullName,
    isAiWorkoutModalOpen,
    setIsAiWorkoutModalOpen,
    error,
  } = useMemberProfileContext();

  if (error) {
    return (
      <div className="p-6">
        <Alert
          variant="destructive"
          className="rounded-2xl border-none shadow-lg"
        >
          <AlertTitle className="font-bold tracking-tight uppercase">
            Грешка при зареждане
          </AlertTitle>
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 duration-500 animate-in fade-in">
      <PageHeader
        title={fullName}
        description={`Управление на профил, членство, документи и тренировъчен процес за ${fullName}.`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членове", href: "/members" },
          { label: fullName },
        ]}
      />

      <MemberProfileHeader />

      <MemberProfileNav />

      <div className="pt-2">{children}</div>

      <AiWorkoutGeneratorModal
        open={isAiWorkoutModalOpen}
        onOpenChange={setIsAiWorkoutModalOpen}
        member={member}
      />
    </div>
  );
}

export function MemberProfileLayoutClient({
  memberId,
  initialData,
  children,
}: MemberProfileLayoutClientProps) {
  return (
    <MemberProfileProvider memberId={memberId} initialData={initialData}>
      <MemberProfileInner>{children}</MemberProfileInner>
    </MemberProfileProvider>
  );
}
