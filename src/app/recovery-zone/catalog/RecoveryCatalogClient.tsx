"use client";

import { useState } from "react";

import PublicCatalogTabs from "@/components/club/PublicCatalogTabs";
import {
  RecoveryInquiryDialog,
  type RecoveryProcedureInfo,
} from "@/components/recovery/RecoveryInquiryDialog";

interface RecoveryCatalogClientProps {
  recoveryServices: Record<string, unknown>[];
  phone?: string;
  contraindications?: string[];
}

export function RecoveryCatalogClient({
  recoveryServices,
  phone,
  contraindications,
}: RecoveryCatalogClientProps) {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] =
    useState<RecoveryProcedureInfo | null>(null);

  const handleRecoveryInquiry = (item: Record<string, unknown>) => {
    let durationVal: string | undefined;
    if (item.duration) {
      durationVal = String(item.duration);
    } else if (item.durationMinutes) {
      durationVal = String(item.durationMinutes);
    }

    setSelectedProcedure({
      title: (item.name as string) || "",
      category: (item.category as string) || undefined,
      duration: durationVal,
      price: item.price
        ? `${(item.price as number).toFixed(2)} EUR`
        : undefined,
    });
    setIsInquiryOpen(true);
  };

  return (
    <>
      <PublicCatalogTabs
        trainings={[]}
        generalServices={[]}
        products={[]}
        recoveryServices={recoveryServices}
        allowedTabs={["recovery"]}
        onRecoveryInquiry={handleRecoveryInquiry}
      />

      <RecoveryInquiryDialog
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        procedure={selectedProcedure}
        phone={phone || "+359 899 82 99 23"}
        contraindications={contraindications}
      />
    </>
  );
}
