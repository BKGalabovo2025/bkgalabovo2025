import { Suspense } from "react";

import { MembersNavHeader } from "@/components/members/list/MembersNavHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function MembersListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Suspense fallback={<HeaderLoading />}>
        <MembersNavHeader />
      </Suspense>
      {children}
    </div>
  );
}

function HeaderLoading() {
  return (
    <div className="space-y-3 pb-2">
      <Skeleton className="h-14 w-64 rounded-xl" />
      <Skeleton className="h-9 w-96 rounded-xl" />
    </div>
  );
}
