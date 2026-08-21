import { Sale } from "@/types";

export type SaleItem = Sale["items"][0];

export interface SaleFormManagerProps {
  title?: string;
  description?: string;
  breadcrumbs?: unknown[];
  cancelUrl?: string;
  initialCart?: SaleItem[];
  initialMemberId?: string;
  initialStatus?: string;
  initialSale?: unknown;
  submitText?: string;
  onSubmit?: (data: {
    cart: SaleItem[];
    memberId: string;
    status: Sale["status"];
    totalAmount: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function SaleFormManager(_props: SaleFormManagerProps) {
  return <div>Изчаквайте актуализация на модул &quot;Продажби&quot;...</div>;
}
