"use client";

import { useMemberProfile } from "@/hooks/useMemberProfile";
import { MemberDetailsCard } from "@/components/members/member-details-card";
import { Member, Sale, ScheduleEvent } from "@/types";
import { Family } from "@/hooks/useMemberProfile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MemberProfileClientProps {
  memberId: string;
  initialData: {
    member: Member;
    family: Family | null;
    familyMembers: Member[];
    attendances: ScheduleEvent[];
    sales: Sale[];
  };
}

export default function MemberProfileClient({
  memberId,
  initialData,
}: MemberProfileClientProps) {
  const { member, family, familyMembers, sales, error, refetch } =
    useMemberProfile(memberId, initialData);

  if (error) {
    return (
      <div className="p-8">
        <Alert
          variant="destructive"
          className="rounded-2xl border-none shadow-lg"
        >
          <AlertTitle className="font-black tracking-tight uppercase">
            Грешка
          </AlertTitle>
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-8">
        <Alert className="rounded-2xl border-none shadow-lg">
          <AlertTitle className="font-black tracking-tight uppercase">
            Не е намерен член
          </AlertTitle>
          <AlertDescription className="font-medium">
            Няма член, съответстващ на това ID.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <MemberDetailsCard
      member={member}
      familyMembers={familyMembers}
      family={family}
      sales={sales}
      onRefresh={refetch}
    />
  );
}
