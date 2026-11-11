"use client";

import React, { Suspense } from "react";

import { ParentPortalSectionId } from "@/components/parents/portal/parent-portal-sections";
import { ParentPortalProvider } from "@/components/parents/portal/ParentPortalContext";
import { ParentPortalSkeleton } from "@/components/parents/portal/ParentPortalSkeleton";
import { ParentPortalViewCoordinator } from "@/components/parents/portal/ParentPortalViewCoordinator";

export default function ParentPortalClient({
  section = "attendance",
}: {
  section?: ParentPortalSectionId;
}) {
  return (
    <Suspense fallback={<ParentPortalSkeleton />}>
      <ParentPortalProvider>
        <ParentPortalViewCoordinator section={section} />
      </ParentPortalProvider>
    </Suspense>
  );
}
