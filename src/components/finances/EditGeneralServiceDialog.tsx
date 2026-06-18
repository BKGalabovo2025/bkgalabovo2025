/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { GeneralService, GeneralServiceEvent, Sale } from "@/types";
import {
  updateGeneralServiceAction,
  getGeneralServiceHistoryAction,
  getGeneralServiceSalesAction,
} from "@/lib/actions/general-services-server";
import { useAppStore } from "@/store/use-app-store";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wrench, Sparkles, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllMembers } from "@/services/member-service";
import { formatDateTimeDisplay } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditGeneralServiceDialogProps {
  service: GeneralService | null;
  isOpen: boolean;
  onClose: () => void;
  onServiceUpdate: () => void;
}

export const EditGeneralServiceDialog = ({
  service,
  isOpen,
  onClose,
  onServiceUpdate,
}: EditGeneralServiceDialogProps) => {
  // Service info states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [pricingUnit, setPricingUnit] = useState<"fixed" | "per_hour" | "per_session">("fixed");
  const [performerName, setPerformerName] = useState("");
  const [performerType, setPerformerType] = useState<"internal" | "external">("internal");
  const [imageUrl, setImageUrl] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const { activeBranch } = useAppStore();

  // History and Tab states
  const [activeTab, setActiveTab] = useState("movements");
  const [movements, setMovements] = useState<GeneralServiceEvent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (isOpen && service && activeBranch) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          // Fetch events
          const historyRes = await getGeneralServiceHistoryAction(activeBranch);
          if (historyRes.success && historyRes.data) {
            const filteredEvents = historyRes.data.filter(
              (e): e is import("@/types").GeneralServiceEvent => e !== null && e.serviceId === service.id
            );
            setMovements(filteredEvents);
          }

          // Fetch sales
          const salesRes = await getGeneralServiceSalesAction(activeBranch);
          if (salesRes.success && salesRes.data) {
            const filteredSales = salesRes.data.filter((s) =>
              s.items?.some((i) => i.productId === service.id)
            );
            setSales(filteredSales);
          }

          // Fetch members map
          const membersData = await getAllMembers();
          const map: Record<string, string> = {};
          membersData.forEach((m) => {
            map[m.id] = `${m.firstName} ${m.lastName}`;
          });
          setMembersMap(map);
        } catch (err) {
          console.error("Error fetching service history:", err);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, service, activeBranch]);

  const getEventLabel = (type: string) => {
    switch (type) {
      case "create":
        return "Създаване";
      case "update":
        return "Редакция";
      case "sale":
        return "Продажба";
      case "delete":
        return "Изтриване";
      default:
        return "Друго";
    }
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case "create":
        return "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400";
      case "sale":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400";
      case "update":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400";
    }
  };

  // Populate states when service changes
  useEffect(() => {
    if (service) {
      setName(service.name || "");
      setDescription(service.description || "");
      setPrice(service.price?.toString() || "0");
      setPricingUnit(service.pricingUnit || "fixed");
      setPerformerName(service.performerName || "");
      setPerformerType(service.performerType || "internal");
      setImageUrl(service.imageUrl || "");
    }
  }, [service]);

  const handleUpdateInfo = async () => {
    if (!service) return;
    if (!name.trim() || !price || !performerName.trim()) {
      toast.error("Грешка", {
        description: "Моля, попълнете задължителните полета.",
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
      const serviceData = {
        name,
        description,
        price: priceVal,
        pricingUnit,
        performerName,
        performerType,
        imageUrl: imageUrl || null,
      };

      const result = await updateGeneralServiceAction(service.id, serviceData);

      if (result.success) {
        toast.success("Успех!", { description: "Информацията е запазена успешно." });
        onServiceUpdate();
        onClose();
      } else {
        toast.error("Грешка", { description: result.error });
      }
    } catch (error) {
      toast.error("Грешка при актуализация", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMovementsContent = () => {
    if (historyLoading) {
      return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 opacity-35" />
          <p className="text-zinc-400 text-xs font-light">
            Зареждане на движения...
          </p>
        </div>
      );
    }
    if (movements.length === 0) {
      return (
        <div className="py-20 text-center text-zinc-400 text-xs font-light">
          Няма записани движения за тази услуга.
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {movements.map((move) => {
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
                  className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shadow-none border-none ${getEventBadgeClass(
                    move.type
                  )}`}
                >
                  {getEventLabel(move.type)}
                </Badge>
              </div>
              {move.oldPrice !== undefined && move.newPrice !== undefined && (
                <div className="flex justify-between items-center text-[11px] text-zinc-500">
                  <span>Промяна на цена:</span>
                  <span>
                    {formatPrice(move.oldPrice)} &rarr; {formatPrice(move.newPrice)}
                  </span>
                </div>
              )}
              <div className="text-[10px] text-zinc-400/80 text-right mt-1">
                Оператор: {move.userName}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSalesContent = () => {
    if (historyLoading) {
      return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 opacity-35" />
          <p className="text-zinc-400 text-xs font-light">
            Зареждане на продажби...
          </p>
        </div>
      );
    }
    if (sales.length === 0) {
      return (
        <div className="py-20 text-center text-zinc-400 text-xs font-light">
          Няма записани продажби за тази услуга.
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {sales.map((sale) => {
          const item = sale.items.find(
            (i) => i.productId === service?.id
          );
          const memberName =
            sale.memberId === "GUEST_EXTERNAL"
              ? "Външен клиент"
              : membersMap[sale.memberId] || "Зареден Член";
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
    );
  };

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] p-8 sm:p-10 rounded-4xl bg-white dark:bg-zinc-950 border-none shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-light text-zinc-950 dark:text-zinc-50 flex items-center gap-3">
            <Wrench className="h-6 w-6 text-zinc-650" strokeWidth={1.5} />
            Редактиране на: {service.name}
          </DialogTitle>
          <DialogDescription className="font-light text-zinc-400 mt-1">
            Промяна на информацията за услугата и преглед на историята.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* LEFT COLUMN: Service Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Информация за услугата
              </h3>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Име на услугата *
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="напр. Наем на корт"
                  className="rounded-xl h-11"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
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
                  <Label htmlFor="edit-pricingUnit" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Ценообразуване *
                  </Label>
                  <Select
                    value={pricingUnit}
                    onValueChange={(val: any) => setPricingUnit(val)}
                    disabled={isProcessing}
                  >
                    <SelectTrigger className="rounded-xl h-11 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                      <SelectValue placeholder="Избери..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="fixed">Фиксирана сума</SelectItem>
                      <SelectItem value="per_hour">На час</SelectItem>
                      <SelectItem value="per_session">На сесия</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-performerName" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Изпълнител *
                  </Label>
                  <Input
                    id="edit-performerName"
                    value={performerName}
                    onChange={(e) => setPerformerName(e.target.value)}
                    placeholder="Име на треньор/клуб"
                    className="rounded-xl h-11"
                    disabled={isProcessing}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-performerType" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Тип изпълнител *
                  </Label>
                  <Select
                    value={performerType}
                    onValueChange={(val: any) => setPerformerType(val)}
                    disabled={isProcessing}
                  >
                    <SelectTrigger className="rounded-xl h-11 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                      <SelectValue placeholder="Избери..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="internal">Вътрешен (Клуб)</SelectItem>
                      <SelectItem value="external">Външен партньор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-imageUrl" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Изображение URL (Снимка)
                </Label>
                <Input
                  id="edit-imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Линк към снимка на услугата..."
                  className="rounded-xl h-11"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Описание
                </Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Допълнителни детайли..."
                  className="rounded-xl min-h-[80px]"
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

          {/* RIGHT COLUMN: Service History System with Tabs */}
          <div className="space-y-6 md:border-l md:border-zinc-100 md:dark:border-zinc-900 md:pl-10 flex flex-col h-full min-h-[450px]">
            <Tabs
              defaultValue="movements"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full flex-1 flex flex-col"
            >
              <TabsList className="bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl h-11 w-full border border-zinc-200/40 dark:border-zinc-800/40 mb-6 flex">
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

              <TabsContent
                value="movements"
                className="outline-none flex-1 max-h-[380px] overflow-y-auto custom-scrollbar space-y-4 pr-1 mt-0"
              >
                {renderMovementsContent()}
              </TabsContent>

              <TabsContent
                value="sales"
                className="outline-none flex-1 max-h-[380px] overflow-y-auto custom-scrollbar space-y-4 pr-1 mt-0"
              >
                {renderSalesContent()}
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
