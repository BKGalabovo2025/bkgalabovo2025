"use client";

import {
  SharedReceiptClient,
  SharedReceiptClientProps,
} from "@/components/shared/sales/SharedReceiptClient";

export default function ReceiptClientPage(
  props: Omit<SharedReceiptClientProps, "backUrl">
) {
  return <SharedReceiptClient {...props} backUrl="/inventory/sales" />;
}
