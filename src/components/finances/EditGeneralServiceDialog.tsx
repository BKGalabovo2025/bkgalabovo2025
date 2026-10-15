/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Sparkles, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GenericMovementsTab } from "@/components/shared/history-tabs/GenericMovementsTab";
import { GenericSalesTab } from "@/components/shared/history-tabs/GenericSalesTab";
import { UniversalMediaUpload } from "@/components/shared/media/UniversalMediaUpload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getGeneralServiceHistoryAction,
  updateGeneralServiceAction,
} from "@/lib/actions/general-services-server";
import { getServiceSalesAction } from "@/lib/actions/sales";
import { formatPrice } from "@/lib/currency";
import { getAllMembers } from "@/services/member-service";
import { useAppStore } from "@/store/use-app-store";
import { GeneralService, GeneralServiceEvent, Sale } from "@/types";

function filterSalesForService(sales: Sale[], serviceId: string) {
  return sales.filter((s) => s.items?.some((i) => i.productId === serviceId));
}

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
  const [pricingUnit, setPricingUnit] = useState<
    "fixed" | "per_hour" | "per_session"
  >("fixed");
  const [performerName, setPerformerName] = useState("");
  const [performerType, setPerformerType] = useState<"internal" | "external">(
    "internal"
  );
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
              (e): e is import("@/types").GeneralServiceEvent =>
                e !== null && e.serviceId === service.id
            );
            setMovements(filteredEvents);
          }

          // Fetch sales
          const salesRes = await getServiceSalesAction(
            "general_service",
            activeBranch
          );
          if (salesRes.success && salesRes.data) {
            const filteredSales = filterSalesForService(
              salesRes.data,
              service.id
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
        toast.success("Успех!", {
          description: "Информацията е запазена успешно.",
        });
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
    return (
      <GenericMovementsTab
        loading={historyLoading}
        movements={movements}
        emptyMessage="Няма записани движения за тази услуга."
        getEventLabel={getEventLabel}
        getEventBadgeClass={getEventBadgeClass}
        renderDetails={(move) =>
          move.oldPrice !== undefined && move.newPrice !== undefined ? (
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Промяна на цена:</span>
              <span>
                {formatPrice(move.oldPrice)} &rarr; {formatPrice(move.newPrice)}
              </span>
            </div>
          ) : null
        }
      />
    );
  };

  const renderSalesContent = () => {
    return (
      <GenericSalesTab
        loading={historyLoading}
        sales={sales}
        targetId={service?.id || ""}
        membersMap={membersMap}
        emptyMessage="Няма записани продажби за тази услуга."
      />
    );
  };

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[88vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-950">
              <Wrench className="size-4.5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-950 sm:text-lg dark:text-zinc-50">
                Редактиране на: {service.name}
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-zinc-400">
                Промяна на информацията за услугата и преглед на историята.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 min-h-0">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* LEFT COLUMN: Service Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
                <Sparkles className="size-4 text-primary" strokeWidth={2} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Информация за услугата
                </h3>
              </div>

              <div className="grid gap-3.5">
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="edit-name"
                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Име на услугата *
                  </Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="напр. Наем на корт"
                    className="h-9.5 rounded-xl text-xs sm:text-sm"
                    disabled={isProcessing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="edit-price"
                      className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
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
                      className="h-9.5 rounded-xl text-xs sm:text-sm"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="edit-pricingUnit"
                      className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                      Ценообразуване *
                    </Label>
                    <Select
                      value={pricingUnit}
                      onValueChange={(val: any) => setPricingUnit(val)}
                      disabled={isProcessing}
                    >
                      <SelectTrigger className="h-9.5 rounded-xl border-zinc-200 bg-zinc-50 text-xs sm:text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="edit-performerName"
                      className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                      Изпълнител *
                    </Label>
                    <Input
                      id="edit-performerName"
                      value={performerName}
                      onChange={(e) => setPerformerName(e.target.value)}
                      placeholder="Име на треньор/клуб"
                      className="h-9.5 rounded-xl text-xs sm:text-sm"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="edit-performerType"
                      className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                      Тип изпълнител *
                    </Label>
                    <Select
                      value={performerType}
                      onValueChange={(val: any) => setPerformerType(val)}
                      disabled={isProcessing}
                    >
                      <SelectTrigger className="h-9.5 rounded-xl border-zinc-200 bg-zinc-50 text-xs sm:text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                        <SelectValue placeholder="Избери..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="internal">
                          Вътрешен (Клуб)
                        </SelectItem>
                        <SelectItem value="external">
                          Външен партньор
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                  <UniversalMediaUpload
                    id="edit-imageUrl"
                    label="Изображение / Снимка"
                    description="PNG, JPG, WEBP (до 800KB)"
                    value={imageUrl}
                    onChange={(url) => setImageUrl(url)}
                    storageFolder="services"
                    placeholderUrl="Линк към снимка на услугата..."
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label
                    htmlFor="edit-description"
                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Описание
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Допълнителни детайли..."
                    className="resize-none rounded-xl text-xs sm:text-sm leading-relaxed"
                    rows={2}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleUpdateInfo}
                disabled={isProcessing}
                className="h-10 w-full rounded-xl bg-zinc-950 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                Запази промените по услугата
              </Button>
            </div>

            {/* RIGHT COLUMN: Service History System with Tabs */}
            <div className="flex h-full flex-col space-y-4 md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-900">
              <Tabs
                defaultValue="movements"
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex w-full flex-1 flex-col"
              >
                <TabsList className="mb-4 flex h-10 w-full rounded-xl border border-zinc-200/40 bg-zinc-100 p-1 dark:border-zinc-800/40 dark:bg-zinc-900/50">
                  <TabsTrigger
                    value="movements"
                    className="flex-1 rounded-lg py-1.5 text-xs font-semibold shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
                  >
                    Движения
                  </TabsTrigger>
                  <TabsTrigger
                    value="sales"
                    className="flex-1 rounded-lg py-1.5 text-xs font-semibold shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
                  >
                    Продажби
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="movements"
                  className="space-y-3 pr-1 outline-none"
                >
                  {renderMovementsContent()}
                </TabsContent>

                <TabsContent
                  value="sales"
                  className="space-y-3 pr-1 outline-none"
                >
                  {renderSalesContent()}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-end border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="h-9 rounded-xl border-zinc-200 px-5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Затвори
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
