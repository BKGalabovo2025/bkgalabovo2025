"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { IssueDocumentTab } from "@/app/(protected)/certificates/components/IssueDocumentTab";
import { useCertificatesContext } from "@/components/certificates/CertificatesContext";

export function StudioSectionView() {
  const router = useRouter();
  const {
    siteId,
    templates,
    sponsors,
    selectedTemplateForIssuance,
    loadTemplates,
    loadIssuedCertificates,
  } = useCertificatesContext();

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return (
    <IssueDocumentTab
      siteId={siteId}
      templates={templates}
      sponsors={sponsors}
      preselectedTemplateId={selectedTemplateForIssuance}
      onIssuedSuccess={async () => {
        await loadIssuedCertificates();
      }}
      onSwitchToRegistry={() => router.push("/certificates/issued")}
      onOpenTemplates={() => router.push("/certificates/templates")}
    />
  );
}
