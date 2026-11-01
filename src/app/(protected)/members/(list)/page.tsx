export const dynamic = "force-dynamic";

import { Suspense } from "react";

import { MembersAllView } from "@/components/members/list/MembersAllView";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member } from "@/types";

export default async function MembersPage() {
  let members: Member[] = [];
  let error = null;

  try {
    members = await getAllMembersServer();
  } catch (err) {
    console.error("Error fetching all members:", err);
    error =
      "Неуспешно зареждане на списъка с членове. Моля, опитайте по-късно.";
  }

  return (
    <div className="space-y-4 pb-8 duration-500 animate-in fade-in">
      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
          <p className="font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        </div>
      ) : (
        <Suspense fallback={<TableLoading />}>
          <MembersAllView initialMembers={members} />
        </Suspense>
      )}
    </div>
  );
}

function TableLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
