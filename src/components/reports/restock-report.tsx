"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportToCSV } from "@/lib/export-utils";
import { Product } from "@/types";

interface RestockReportProps {
  initialProducts: Product[];
}

const RestockReport = ({ initialProducts }: RestockReportProps) => {
  const [productsToRestock] = useState<Product[]>(initialProducts);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Протокол за презареждане</CardTitle>
          <CardDescription>
            Списък на продуктите, чиято наличност е достигнала или е под прага
            за презареждане.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const data = productsToRestock.map((p) => ({
              Продукт: p.name,
              Наличност: p.stock,
              Праг: p.restockThreshold,
            }));
            exportToCSV(data, "Протокол-презареждане.csv");
          }}
          disabled={productsToRestock.length === 0}
        >
          <Download className="mr-2 size-4" />
          Експорт (CSV)
        </Button>
      </CardHeader>
      <CardContent>
        {productsToRestock.length === 0 ? (
          <p>Няма продукти за презареждане.</p>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Продукт</TableHead>
                    <TableHead className="text-center">
                      Текуща наличност
                    </TableHead>
                    <TableHead className="text-center">
                      Праг за презареждане
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsToRestock.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.restockThreshold}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 md:hidden">
              {productsToRestock.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {product.name}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Наличност:</span>
                    <span className="font-bold text-rose-600">
                      {product.stock} бр.
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Праг:</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {product.restockThreshold} бр.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RestockReport;
