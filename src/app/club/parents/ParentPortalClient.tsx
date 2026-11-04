"use client";

import { Loader2 } from "lucide-react";
import React, { Suspense } from "react";

import { ParentPortalProvider } from "@/components/parents/portal/ParentPortalContext";
import { ParentPortalViewCoordinator } from "@/components/parents/portal/ParentPortalViewCoordinator";

export default function ParentPortalClient() {
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
        <ParentPortalViewCoordinator />
      </ParentPortalProvider>
    </Suspense>
  );
}
