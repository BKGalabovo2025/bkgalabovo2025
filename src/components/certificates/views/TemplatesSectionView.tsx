"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { TemplatesTab } from "@/app/(protected)/certificates/components/TemplatesTab";
import { useCertificatesContext } from "@/components/certificates/CertificatesContext";

export function TemplatesSectionView() {
  const router = useRouter();
  const {
    siteId,
    templates,
    sponsors,
    isLoadingTemplates,
    loadTemplates,
    setSelectedTemplateForIssuance,
  } = useCertificatesContext();

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return (
    <TemplatesTab
      siteId={siteId}
      templates={templates}
      sponsors={sponsors}
      isLoading={isLoadingTemplates}
      onRefresh={loadTemplates}
      onSelectForIssuance={(templateId) => {
        setSelectedTemplateForIssuance(templateId);
        router.push("/certificates/studio");
      }}
    />
  );
}
