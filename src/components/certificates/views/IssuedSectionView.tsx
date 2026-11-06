"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { IssuedCertificatesTab } from "@/app/(protected)/certificates/components/IssuedCertificatesTab";
import { useCertificatesContext } from "@/components/certificates/CertificatesContext";

export function IssuedSectionView() {
  const router = useRouter();
  const {
    siteId,
    issuedCertificates,
    isLoadingCertificates,
    loadIssuedCertificates,
  } = useCertificatesContext();

  useEffect(() => {
    // Ensure certificates are fresh when viewing this section
    loadIssuedCertificates();
  }, [loadIssuedCertificates]);

  return (
    <IssuedCertificatesTab
      siteId={siteId}
      certificates={issuedCertificates}
      isLoading={isLoadingCertificates}
      onRefresh={loadIssuedCertificates}
      onSwitchToIssue={() => router.push("/certificates/issue")}
    />
  );
}
