export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";

import { stripHeavyFieldsForMemberList } from "@/components/members/list/member-list-sections";
import { MembersFamiliesView } from "@/components/members/list/MembersFamiliesView";
import { Skeleton } from "@/components/ui/skeleton";
import { type Family } from "@/hooks/useFamilies";
import { getFamiliesFeedAction } from "@/lib/actions/families";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member } from "@/types";

export const metadata: Metadata = {
  title: "Семейства | БК Гълъбово",
  description:
    "Управление на семейни връзки, групови абонаменти и роднински профили в клуба.",
};

export default async function FamiliesPage() {
  let members: Member[] = [];
  let initialFamilies: Family[] = [];
  let error = null;

  try {
    const [allMembers, familiesFeed] = await Promise.all([
      getAllMembersServer(),
      getFamiliesFeedAction(),
    ]);
    members = stripHeavyFieldsForMemberList(allMembers);
    if (familiesFeed.success && Array.isArray(familiesFeed.families)) {
      initialFamilies = familiesFeed.families as Family[];
    }
  } catch (err) {
    console.error("Error fetching families data:", err);
    error =
      "Неуспешно зареждане на семейните профили. Моля, опитайте по-късно.";
  }

  return (
    <div className="space-y-4 pb-8">
      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
          <p className="font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        </div>
      ) : (
        <Suspense fallback={<FamiliesLoading />}>
          <MembersFamiliesView
            initialMembers={members}
            initialFamilies={initialFamilies}
          />
        </Suspense>
      )}
    </div>
  );
}

function FamiliesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
