"use client";

import { useParams } from "next/navigation";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MemberDetailsCard } from "@/components/members/member-details-card";
import { PageHeader } from "@/components/layout/page-header";
import { formatFullName } from "@/lib/utils";

const MemberProfilePage = () => {
  const params = useParams();
  const memberId = params.id as string;

  const {
    member,
    family,
    familyMembers,
    sales,
    loading,
    error,
    refetch,
  } = useMemberProfile(memberId);

  if (loading)
    return (
      <div className="space-y-8 animate-pulse pb-12">
        <PageHeader
          title="Зареждане..."
          description="Моля изчакайте, докато заредим профила на члена."
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Членове", href: "/members" },
            { label: "Профил" },
          ]}
        />
        <div className="bg-white rounded-4xl p-8 shadow-sm">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-8">
        <Alert
          variant="destructive"
          className="rounded-2xl border-none shadow-lg"
        >
          <AlertTitle className="font-black uppercase tracking-tight">
            Грешка
          </AlertTitle>
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      </div>
    );

  if (!member)
    return (
      <div className="p-8">
        <Alert className="rounded-2xl border-none shadow-lg">
          <AlertTitle className="font-black uppercase tracking-tight">
            Не е намерен член
          </AlertTitle>
          <AlertDescription className="font-medium">
            Няма член, съответстващ на това ID.
          </AlertDescription>
        </Alert>
      </div>
    );

  const fullName = formatFullName(member);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title={fullName}
        description={`Управление на профил, членство и присъствия за ${fullName}.`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членове", href: "/members" },
          { label: fullName },
        ]}
      />

      <div className="px-0 sm:px-0">
        <MemberDetailsCard
          member={member}
          familyMembers={familyMembers}
          family={family}
          sales={sales}
          onRefresh={refetch}
        />
      </div>
    </div>
  );
};

export default MemberProfilePage;
