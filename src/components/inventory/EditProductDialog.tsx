"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Product } from "@/types";
import {
  restockProductAction,
  adjustProductStockAction,
  updateProductAction,
} from "@/lib/actions/inventory";
import { useAuth } from "@/context/auth-context";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Package,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInventoryEvents } from "@/services/inventory-service";
import { getSales } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";
import { formatDateTimeDisplay } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { InventoryEvent, Sale } from "@/types";
import { formatPrice } from "@/lib/currency";

interface EditProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdate: () => void;
}

export const EditProductDialog = ({
  product,
  isOpen,
  onClose,
  onProductUpdate,
}: EditProductDialogProps) => {
  // Product info states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [restockThreshold, setRestockThreshold] = useState("");
  const [description, setDescription] = useState("");

  // Stock operations states
  const [restockAmount, setRestockAmount] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { idToken } = useAuth();

  // History and Tab states
  const [activeTab, setActiveTab] = useState("stock");
  const [movements, setMovements] = useState<InventoryEvent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          // Fetch events
          const allEvents = await getInventoryEvents();
          const filteredEvents = allEvents.filter(
            (e) => e.productId === product.id
          );
          setMovements(
            filteredEvents.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
          );

          // Fetch sales
          const allSales = await getSales();
          const filteredSales = allSales.filter((s) =>
            s.items?.some((i) => i.productId === product.id)
          );
          setSales(filteredSales);

          // Fetch members map
          const membersData = await getAllMembers();
          const map: Record<string, string> = {};
          membersData.forEach((m) => {
            map[m.id] = `${m.firstName} ${m.lastName}`;
          });
          setMembersMap(map);
        } catch (err) {
          console.error("Error fetching product history:", err);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, product]);

  const getEventLabel = (type: string) => {
    switch (type) {
      case "restock":
        return "Зареждане";
      case "correction":
        return "Корекция";
      case "price_update":
        return "Промяна цена";
      case "sale":
        return "Продажба";
      case "initial":
        return "Първоначално";
      default:
        return "Друго";
    }
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case "restock":
        return "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400";
      case "sale":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400";
      case "price_update":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
      case "correction":
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400";
    }
  };

  // Populate states when product changes
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategory(product.category || "");
      setPrice(product.price?.toString() || "0");
      setImageUrl(product.imageUrl || "");
      setRestockThreshold(product.restockThreshold?.toString() || "");
      setDescription(product.description || "");
    }
  }, [product]);

  const handleUpdateInfo = async () => {
    if (!product || !idToken) return;
    if (!name.trim() || !category.trim() || !price) {
      toast.error("Грешка", {
        description: "Моля, попълнете всички задължителни полета.",
      });
      return;
    }

    const priceVal = parseFloat(price);
    if (isNaN(priceVal) || priceVal < 0) {
      toast.error("Грешка", {
        description: "Моля, въведете валидна, неотрицателна цена.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const productData = {
        name,
        category,
        price: priceVal,
        description,
        imageUrl,
        restockThreshold: restockThreshold
          ? parseInt(restockThreshold, 10)
          : null,
      };

      const result = await updateProductAction(
        product.id,
        idToken,
        productData
      );

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при актуализация", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestock = async () => {
    if (!product || !restockAmount || !idToken) return;
    const amount = parseInt(restockAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Грешка", {
        description:
          "Моля, въведете валидно положително число за презареждане.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await restockProductAction(product.id, idToken, amount);

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при презареждане", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
      setRestockAmount("");
    }
  };

  const handleAdjustment = async () => {
    if (!product || !adjustmentAmount || !idToken) return;
    const amount = parseInt(adjustmentAmount, 10);

    if (isNaN(amount) || amount === 0) {
      toast.error("Грешка", {
        description: "Моля, въведете валидно, ненулево число за корекция.",
      });
      return;
    }

    if (amount < 0 && !adjustmentNotes) {
      toast.error("Грешка", {
        description: "При отписване на количества, бележката е задължителна.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const newStock = product.stock + amount;
      const result = await adjustProductStockAction(
        product.id,
        idToken,
        newStock,
        adjustmentNotes
      );

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        onProductUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error("Грешка при корекция", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
      setAdjustmentAmount("");
      setAdjustmentNotes("");
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] p-8 sm:p-10 rounded-4xl bg-white dark:bg-zinc-950 border-none shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-light text-zinc-950 dark:text-zinc-50 flex items-center gap-3">
            <Package className="h-6 w-6 text-zinc-650" strokeWidth={1.5} />
            Редактиране на: {product.name}
          </DialogTitle>
          <DialogDescription className="font-light text-zinc-400 mt-1">
            Промяна на информацията за артикула, добавяне на снимки и управление
            на складовите наличности.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* LEFT COLUMN: Product Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Информация за продукта
              </h3>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-name"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Име на артикула *
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="напр. Грип Pro's Pro"
                  className="rounded-xl h-11"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="edit-category"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Категория *
                </Label>
                <Input
                  id="edit-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="напр. Грипове, Пера, Екипировка"
                  className="rounded-xl h-11"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="edit-price"
                    className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    Цена (EUR) *
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl h-11"
                    disabled={isProcessing}
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="edit-threshold"
                    className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                  >
                    Минимален праг (бр.)
                  </Label>
                  <Input
                    id="edit-threshold"
                    type="number"
                    value={restockThreshold}
                    onChange={(e) => setRestockThreshold(e.target.value)}
                    placeholder="напр. 5"
                    className="rounded-xl h-11"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="edit-image"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Изображение URL (Снимка)
                </Label>
                <Input
                  id="edit-image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Линк към снимка на артикула..."
                  className="rounded-xl h-11"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="edit-description"
                  className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Описание
                </Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Допълнителни спецификации, размери или бележки..."
                  className="rounded-xl"
                  rows={3}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateInfo}
              disabled={isProcessing}
              className="w-full rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 h-12 font-medium text-[11px] uppercase tracking-widest transition-all mt-4"
            >
              Запази информацията
            </Button>
          </div>

          {/* RIGHT COLUMN: Inventory Movements System with Tabs */}
          <div className="space-y-6 md:border-l md:border-zinc-100 md:dark:border-zinc-900 md:pl-10 flex flex-col h-full min-h-[450px]">
            <Tabs
              defaultValue="stock"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full flex-1 flex flex-col"
            >
              <TabsList className="bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl h-11 w-full border border-zinc-200/40 dark:border-zinc-800/40 mb-6 flex">
                <TabsTrigger
                  value="stock"
                  className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all py-2"
                >
                  Наличност
                </TabsTrigger>
                <TabsTrigger
                  value="movements"
                  className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all py-2"
                >
                  Движения
                </TabsTrigger>
                <TabsTrigger
                  value="sales"
                  className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all py-2"
                >
                  Продажби
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: STOCK OPERATIONS */}
              <TabsContent
                value="stock"
                className="outline-none flex-1 space-y-6"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-amber-500 animate-spin-slow" />
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      Склад & Движения
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-zinc-500">
                    Текуща наличност:{" "}
                    <strong className="text-zinc-950 dark:text-white font-bold">
                      {product.stock} бр.
                    </strong>
                  </span>
                </div>

                <div className="space-y-6">
                  {/* RESTOCK */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="restock-amount"
                      className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
                    >
                      Презареждане (Добавяне на стока)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="restock-amount"
                        type="number"
                        placeholder="Количество (напр. 10)"
                        value={restockAmount}
                        onChange={(e) => setRestockAmount(e.target.value)}
                        disabled={isProcessing}
                        className="rounded-xl h-11"
                      />
                      <Button
                        onClick={handleRestock}
                        disabled={isProcessing || !restockAmount}
                        className="rounded-xl h-11 px-5 bg-zinc-950 text-white hover:bg-zinc-800"
                      >
                        Заприходи
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-900"></div>

                  {/* ADJUSTMENT */}
                  <div className="space-y-3">
                    <div className="flex flex-col gap-0.5">
                      <Label
                        htmlFor="adjustment-amount"
                        className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-zinc-400" />
                        Корекция / Ръчно Отписване
                      </Label>
                      <p className="text-[10px] text-zinc-400 font-light">
                        Използвайте отрицателно число за бракуване/отписване
                        (напр. -5).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        id="adjustment-amount"
                        type="number"
                        placeholder="Количество"
                        value={adjustmentAmount}
                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                        disabled={isProcessing}
                        className="rounded-xl h-11"
                      />
                      <Button
                        onClick={handleAdjustment}
                        disabled={isProcessing || !adjustmentAmount}
                        className="rounded-xl h-11 px-5 bg-rose-500 hover:bg-rose-600 text-white"
                      >
                        Коригирай
                      </Button>
                    </div>

                    <div className="grid gap-1.5">
                      <Label
                        htmlFor="adjustment-notes"
                        className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider"
                      >
                        Причина / Бележка
                      </Label>
                      <Textarea
                        id="adjustment-notes"
                        placeholder="Причина (задължително при отписване/бракуване)..."
                        value={adjustmentNotes}
                        onChange={(e) => setAdjustmentNotes(e.target.value)}
                        disabled={isProcessing}
                        className="rounded-xl"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: INVENTORY MOVEMENTS HISTORY */}
              <TabsContent
                value="movements"
                className="outline-none flex-1 max-h-[380px] overflow-y-auto custom-scrollbar space-y-4 pr-1"
              >
                {historyLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500 opacity-35" />
                    <p className="text-zinc-400 text-xs font-light">
                      Зареждане на движения...
                    </p>
                  </div>
                ) : movements.length > 0 ? (
                  <div className="space-y-3">
                    {movements.map((move) => {
                      const isPositive = move.quantityChange > 0;
                      const isNegative = move.quantityChange < 0;
                      return (
                        <div
                          key={move.id}
                          className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-100/50 dark:border-zinc-900 space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-[10px]">
                              {formatDateTimeDisplay(move.createdAt)}
                            </span>
                            <Badge
                              className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shadow-none border-none ${getEventBadgeClass(move.type)}`}
                            >
                              {getEventLabel(move.type)}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Количество:</span>
                            <span
                              className={`font-semibold ${isPositive ? "text-green-600" : isNegative ? "text-rose-600" : "text-zinc-650"}`}
                            >
                              {isPositive
                                ? `+${move.quantityChange}`
                                : move.quantityChange}{" "}
                              бр.
                            </span>
                          </div>
                          {move.notes && (
                            <p className="text-zinc-400 italic text-[11px] border-t border-zinc-200/50 dark:border-zinc-800/50 pt-1.5 mt-1">
                              Бележка: {move.notes}
                            </p>
                          )}
                          <div className="text-[10px] text-zinc-400/80 text-right mt-1">
                            Оператор: {move.userName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center text-zinc-400 text-xs font-light">
                    Няма записани движения за този продукт.
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: PRODUCT SALES HISTORY */}
              <TabsContent
                value="sales"
                className="outline-none flex-1 max-h-[380px] overflow-y-auto custom-scrollbar space-y-4 pr-1"
              >
                {historyLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 opacity-35" />
                    <p className="text-zinc-400 text-xs font-light">
                      Зареждане на продажби...
                    </p>
                  </div>
                ) : sales.length > 0 ? (
                  <div className="space-y-3">
                    {sales.map((sale) => {
                      const item = sale.items.find(
                        (i) => i.productId === product.id
                      );
                      const memberName =
                        membersMap[sale.memberId] || "Зареден Член";
                      return (
                        <div
                          key={sale.id}
                          className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-100/50 dark:border-zinc-900 space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-[10px]">
                              {new Date(sale.saleDate).toLocaleDateString(
                                "bg-BG"
                              )}
                            </span>
                            <Badge
                              className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shadow-none border-none ${
                                sale.isPaid
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                              }`}
                            >
                              {sale.isPaid ? "Платено" : "Неплатено"}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Клиент:</span>
                            <span className="font-semibold text-zinc-900 dark:text-white">
                              {memberName}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Брой:</span>
                            <span className="font-medium">
                              {item?.quantity || 1} бр.
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
                            <span className="text-zinc-500">Сума:</span>
                            <span className="font-bold text-emerald-500">
                              {formatPrice(sale.totalAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center text-zinc-400 text-xs font-light">
                    Няма записани продажби за този продукт.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl px-6"
          >
            Затвори
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
