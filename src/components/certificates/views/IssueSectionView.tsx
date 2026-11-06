"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { UploadVoucherTab } from "@/app/(protected)/certificates/components/UploadVoucherTab";
import { useCertificatesContext } from "@/components/certificates/CertificatesContext";

export function IssueSectionView() {
  const router = useRouter();
  const { siteId, sponsors, loadIssuedCertificates } = useCertificatesContext();

  return (
    <UploadVoucherTab
      siteId={siteId}
      sponsors={sponsors}
      onIssuedSuccess={async () => {
        await loadIssuedCertificates();
      }}
      onSwitchToRegistry={() => router.push("/certificates/issued")}
    />
  );
}
