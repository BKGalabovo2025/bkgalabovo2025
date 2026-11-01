export const dynamic = "force-dynamic";

import { Suspense } from "react";

import { MembersRecoveryView } from "@/components/members/list/MembersRecoveryView";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member } from "@/types";

export default async function RecoveryMembersPage() {
  let members: Member[] = [];
  let error = null;

  try {
    members = await getAllMembersServer();
  } catch (err) {
    console.error("Error fetching recovery members:", err);
    error =
      "Неуспешно зареждане на клиентите на възстановителната зона. Моля, опитайте по-късно.";
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
        <Suspense fallback={<RecoveryLoading />}>
          <MembersRecoveryView initialMembers={members} />
        </Suspense>
      )}
    </div>
  );
}

function RecoveryLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl sm:col-span-2" />
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
