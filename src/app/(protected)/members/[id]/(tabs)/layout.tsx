import { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { MemberProfileLayoutClient } from "@/components/members/profile/MemberProfileLayoutClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getMemberProfileDataServerAction } from "@/lib/actions/members";
import { formatFullName } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface MemberLayoutProps {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: memberId } = await params;
  const result = await getMemberProfileDataServerAction(memberId);

  if (!result.success || !result.data) {
    return {
      title: "Досие на член - Бадминтон клуб Гълъбово",
      description:
        "Пълен профил, лични данни, документи, такси и тренировъчна статистика за член на Бадминтон клуб Гълъбово.",
    };
  }

  const name = formatFullName(result.data.member);
  return {
    title: `${name} | Досие на член - Бадминтон клуб Гълъбово`,
    description: `Пълен профил, документи, такси и тренировъчна статистика за ${name}.`,
  };
}

export default async function MemberProfileTabsLayout({
  params,
  children,
}: MemberLayoutProps) {
  const { id: memberId } = await params;
  const result = await getMemberProfileDataServerAction(memberId);

  if (!result.success || !result.data) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <Alert
          variant="destructive"
          className="rounded-2xl border-none shadow-lg"
        >
          <AlertTitle className="font-bold tracking-tight uppercase">
            Членът не бе намерен
          </AlertTitle>
          <AlertDescription className="font-medium">
            {result.message || "Няма намерен член с посочения идентификатор."}
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/members"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            ← Към списъка с членове
          </Link>
          <Link
            href="/parents/accounts"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            Родителски акаунти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MemberProfileLayoutClient memberId={memberId} initialData={result.data}>
      {children}
    </MemberProfileLayoutClient>
  );
}
