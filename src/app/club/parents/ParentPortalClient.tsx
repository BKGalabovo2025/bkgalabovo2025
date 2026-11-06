"use client";

import { Loader2 } from "lucide-react";
import React, { Suspense } from "react";

import { ParentPortalSectionId } from "@/components/parents/portal/parent-portal-sections";
import { ParentPortalProvider } from "@/components/parents/portal/ParentPortalContext";
import { ParentPortalViewCoordinator } from "@/components/parents/portal/ParentPortalViewCoordinator";

export default function ParentPortalClient({
  section = "attendance",
}: {
  section?: ParentPortalSectionId;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">
            Зареждане на родителския портал...
          </p>
        </div>
      }
    >
      <ParentPortalProvider>
        <ParentPortalViewCoordinator section={section} />
      </ParentPortalProvider>
    </Suspense>
  );
}
