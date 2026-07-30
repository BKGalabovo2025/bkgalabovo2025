export const dynamic = "force-dynamic";

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member } from "@/types";

import MembersClient from "./MembersClient";

export default async function MembersPage() {
  let members: Member[] = [];
  let error = null;

  try {
    members = await getAllMembersServer();
  } catch (err) {
    console.error("Error fetching members:", err);
    error =
      "Неуспешно зареждане на списъка с членове. Моля, опитайте по-късно.";
  }

  return (
    <div className="space-y-8 pb-12 duration-500 animate-in fade-in">
      {error ? (
        <div className="rounded-5xl border border-rose-100 bg-rose-50 p-8 text-center">
          <p className="font-medium text-rose-600">{error}</p>
        </div>
      ) : (
        <Suspense fallback={<MembersLoading />}>
          <MembersClient initialMembers={members} />
        </Suspense>
      )}
    </div>
  );
}

function MembersLoading() {
  return (
    <div className="space-y-6 p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <div className="space-y-4 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
