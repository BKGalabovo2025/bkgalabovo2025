"use client";

import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inventoryService } from "@/services/inventory-service";
import { useAppStore } from "@/store/use-app-store";
import { AllocationType, InventoryItem } from "@/types/inventory.types";

interface InventoryMobileCardProps {
  item: InventoryItem;
  allocationText: string;
  onEdit: () => void;
  onDelete: () => void;
}

function InventoryMobileCard({
  item,
  allocationText,
  onEdit,
  onDelete,
}: InventoryMobileCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            {item.name}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {allocationText}
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          {item.totalQuantity} бр.
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-900">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-8 gap-1.5 rounded-lg text-xs text-zinc-600 hover:text-indigo-600 dark:text-zinc-400"
        >
          <Edit className="size-3.5" />
          Редактирай
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 gap-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
        >
          <Trash2 className="size-3.5" />
          Изтрий
        </Button>
      </div>
    </div>
  );
}

export default function InventoryClient() {
  const { activeBranch } = useAppStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [allocationType, setAllocationType] =
    useState<AllocationType>("per_child");
  const [ratioValue, setRatioValue] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchInventory = useCallback(async () => {
    setIsFetching(true);
    try {
      // Auto seed if empty
      let curr = await inventoryService.getInventory(activeBranch);
      if (curr.length === 0) {
        await inventoryService.seedDefaultInventory(activeBranch);
        curr = await inventoryService.getInventory(activeBranch);
      }
      setItems(curr.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  }, [activeBranch]);

  useEffect(() => {
    void fetchInventory();
  }, [fetchInventory]);

  const handleOpenForm = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setTotalQuantity(item.totalQuantity);
      setAllocationType(item.allocationType);
      setRatioValue(item.ratioValue || "");
    } else {
      setEditingItem(null);
      setName("");
      setTotalQuantity(1);
      setAllocationType("per_child");
      setRatioValue("");
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const payload: Omit<
        InventoryItem,
        "id" | "siteId" | "createdAt" | "updatedAt"
      > = {
        name,
        totalQuantity,
        allocationType,
      };
      if (
        (allocationType === "ratio" || allocationType === "per_station") &&
        ratioValue
      ) {
        payload.ratioValue = Number(ratioValue);
      }

      if (editingItem) {
        await inventoryService.updateInventoryItem(editingItem.id, payload);
      } else {
        await inventoryService.addInventoryItem(activeBranch, payload);
      }
      setIsFormOpen(false);
      fetchInventory();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този уред?")) return;
    try {
      await inventoryService.deleteInventoryItem(id);
      fetchInventory();
    } catch (error) {
      console.error(error);
    }
  };

  const getAllocationText = (item: InventoryItem) => {
    if (item.allocationType === "per_child") {
      return item.ratioValue
        ? `${item.ratioValue} бр. на дете`
        : "1 бр. на дете";
    }
    if (item.allocationType === "per_station") {
      return item.ratioValue
        ? `${item.ratioValue} бр. на станция`
        : "1 бр. на станция";
    }
    if (item.allocationType === "ratio") {
      return `Коефициент: ${item.ratioValue || 1} (напр. 1 топка / 2 деца = 0.5)`;
    }
    return "";
  };

  if (isFetching) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
          Списък с уреди ({items.length})
        </h2>
        <Button
          onClick={() => handleOpenForm()}
          className="w-full sm:w-auto gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus className="size-4" />
          Добави уред
        </Button>
      </div>

      {/* Mobile Cards (< md) */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <InventoryMobileCard
            key={item.id}
            item={item}
            allocationText={getAllocationText(item)}
            onEdit={() => handleOpenForm(item)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
        {items.length === 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            Няма добавено оборудване.
          </div>
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Уред / Оборудване</TableHead>
              <TableHead className="w-32 text-center">
                Наличност (бр.)
              </TableHead>
              <TableHead>Правило за разпределение (в Станции)</TableHead>
              <TableHead className="w-24 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-zinc-900">
                  {item.name}
                </TableCell>
                <TableCell className="text-center">
                  <div className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                    {item.totalQuantity}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-zinc-600">
                  {getAllocationText(item)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenForm(item)}
                      className="text-zinc-500 hover:text-indigo-600"
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="text-zinc-500 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-zinc-500"
                >
                  Няма добавено оборудване.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Редакция на уред" : "Добави нов уред"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inventoryItemName">Име на уреда</Label>
              <Input
                id="inventoryItemName"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="напр. Медицинска топка"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventoryTotalQuantity">
                Общо налично количество (бр.)
              </Label>
              <Input
                id="inventoryTotalQuantity"
                name="totalQuantity"
                type="number"
                min={0}
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventoryAllocationType">
                Логика на разпределение (Allocation)
              </Label>
              <Select
                name="allocationType"
                value={allocationType}
                onValueChange={(val: AllocationType) => setAllocationType(val)}
              >
                <SelectTrigger id="inventoryAllocationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_child">За всяко дете (1:1)</SelectItem>
                  <SelectItem value="per_station">
                    Споделено на станция (1 per Station)
                  </SelectItem>
                  <SelectItem value="ratio">
                    Пропорционално (Скалируемо)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(allocationType === "ratio" ||
              allocationType === "per_station" ||
              allocationType === "per_child") && (
              <div className="space-y-2">
                <Label htmlFor="inventoryRatioValue">
                  Коефициент (Multiplier/Ratio)
                </Label>
                <Input
                  id="inventoryRatioValue"
                  name="ratioValue"
                  type="number"
                  step={0.1}
                  value={ratioValue}
                  onChange={(e) =>
                    setRatioValue(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder={(() => {
                    if (allocationType === "per_child")
                      return "Напр. 2 (2 пера на дете)";
                    if (allocationType === "per_station")
                      return "Напр. 4 (4 конуса на станция)";
                    return "Напр. 0.5 (1 топка на 2 деца)";
                  })()}
                />
                <p className="text-xs text-zinc-500">
                  Ако оставите празно, по подразбиране е 1.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Отказ
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isSaving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Запази
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
