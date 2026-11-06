"use client";

import { Download } from "lucide-react";
import Link from "next/link";
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
    <Card className="border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
            Протокол за презареждане
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Списък на продуктите, чиято наличност е достигнала или е под прага
            за презареждане.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-800"
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
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Няма продукти за презареждане. Всички наличности са над определения
            праг.
          </p>
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
                        <Link
                          href={`/catalogs/shop/${product.id}/edit`}
                          className="text-zinc-900 hover:text-indigo-600 hover:underline dark:text-zinc-100 dark:hover:text-indigo-400"
                        >
                          {product.name}
                        </Link>
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
                    <Link
                      href={`/catalogs/shop/${product.id}/edit`}
                      className="hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
                    >
                      {product.name}
                    </Link>
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
