"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types";
import { getProducts } from "@/services/inventory-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export-utils";

const RestockReport = () => {
  const [productsToRestock, setProductsToRestock] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const allProducts = await getProducts();
        const filteredProducts = allProducts.filter(
          (p) =>
            typeof p.restockThreshold === "number" &&
            p.stock <= p.restockThreshold
        );
        setProductsToRestock(filteredProducts);
      } catch (error) {
        console.error("Failed to fetch products for restock report:", error);
        // Display error to user
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Зареждане на протокола...
      </div>
    );
  }

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
          <Download className="mr-2 h-4 w-4" />
          Експорт (CSV)
        </Button>
      </CardHeader>
      <CardContent>
        {productsToRestock.length === 0 ? (
          <p>Няма продукти за презареждане.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Продукт</TableHead>
                <TableHead className="text-center">Текуща наличност</TableHead>
                <TableHead className="text-center">
                  Праг за презареждане
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsToRestock.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-center">{product.stock}</TableCell>
                  <TableCell className="text-center">
                    {product.restockThreshold}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RestockReport;
