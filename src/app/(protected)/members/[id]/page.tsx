import { Metadata } from "next";
import { getMemberProfileDataServerAction } from "@/lib/actions/members";
import { PageHeader } from "@/components/layout/page-header";
import { formatFullName } from "@/lib/utils";
import MemberProfileClient from "./MemberProfileClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Профил на член - Бадминтон клуб Гълъбово",
  description:
    "Детайлен преглед на личните данни, документи, плащания и присъствия.",
};

interface MemberProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberProfilePage({
  params,
}: MemberProfilePageProps) {
  const { id: memberId } = await params;

  const result = await getMemberProfileDataServerAction(memberId);

  if (!result.success || !result.data) {
    return (
      <div className="p-8">
        <Alert
          variant="destructive"
          className="rounded-2xl border-none shadow-lg"
        >
          <AlertTitle className="font-black tracking-tight uppercase">
            Грешка
          </AlertTitle>
          <AlertDescription className="font-medium">
            {result.message || "Неуспешно зареждане на профила."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { member } = result.data;
  const fullName = formatFullName(member);

  return (
    <div className="space-y-8 pb-12 duration-500 animate-in fade-in">
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
        <MemberProfileClient memberId={memberId} initialData={result.data} />
      </div>
    </div>
  );
}
