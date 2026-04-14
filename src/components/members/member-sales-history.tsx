"use client";

import { useRouter } from "next/navigation";
import { useSales } from "@/hooks/useSales";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";

interface MemberSalesHistoryProps {
  memberId: string;
}

// Helper to determine badge variant and text based on status and amount
const getStatusDetails = (
  status: "completed" | "pending" | "informational" | string,
  totalAmount: number
) => {
  if (totalAmount === 0 && status === "informational") {
    return { text: "Системна", variant: "outline" as const };
  }

  switch (status) {
    case "completed":
      return { text: "Платено", variant: "default" as const };
    case "pending":
      return { text: "Чакащо", variant: "secondary" as const };
    // Fallback for old data that might have status: 'completed' but amount: 0
    case "completed":
      if (totalAmount === 0)
        return { text: "Нулева", variant: "outline" as const };
      return { text: "Платено", variant: "default" as const };
    default:
      return { text: status, variant: "secondary" as const };
  }
};

export const MemberSalesHistory = ({ memberId }: MemberSalesHistoryProps) => {
  const router = useRouter();
  const { sales, loading, error } = useSales(memberId);

  const handleRowClick = (saleId: string) => {
    router.push(`/sales/${saleId}/receipt`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">История на продажбите</h3>
        <Button
          size="sm"
          onClick={() => router.push(`/sales/new?memberId=${memberId}`)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Нова продажба
        </Button>
      </div>
      {loading ? (
        <p>Зареждане...</p>
      ) : error ? (
        <p>Грешка: {error}</p>
      ) : sales.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Няма регистрирани продажби.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Обща сума</TableHead>
              <TableHead>
                <span className="sr-only">Действия</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => {
              const statusDetails = getStatusDetails(
                sale.status,
                sale.totalAmount
              );

              return (
                <TableRow
                  key={sale.id}
                  onClick={() => handleRowClick(sale.id)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    {new Date(sale.saleDate).toLocaleDateString("bg-BG")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusDetails.variant}>
                      {statusDetails.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(sale.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => handleRowClick(sale.id)}
                        >
                          Преглед на квитанция
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
