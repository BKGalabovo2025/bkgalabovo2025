"use client";

import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import { useEffect, useState } from "react";

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

export default function InventoryClient() {
  const { activeBranch } = useAppStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [allocationType, setAllocationType] = useState<AllocationType>("per_child");
  const [ratioValue, setRatioValue] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [activeBranch]);

  const fetchInventory = async () => {
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
  };

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
      const payload: Omit<InventoryItem, "id" | "siteId" | "createdAt" | "updatedAt"> = {
        name,
        totalQuantity,
        allocationType,
      };
      if (allocationType === "ratio" && ratioValue) {
        payload.ratioValue = Number(ratioValue);
      } else if (allocationType === "per_station" && ratioValue) {
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-800">Списък с уреди</h2>
        <Button onClick={() => handleOpenForm()} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="size-4" />
          Добави уред
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Уред / Оборудване</TableHead>
              <TableHead className="w-32 text-center">Наличност (бр.)</TableHead>
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
                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
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
              <Label>Име на уреда</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="напр. Медицинска топка"
              />
            </div>

            <div className="space-y-2">
              <Label>Общо налично количество (бр.)</Label>
              <Input
                type="number"
                min={0}
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Логика на разпределение (Allocation)</Label>
              <Select
                value={allocationType}
                onValueChange={(val: AllocationType) => setAllocationType(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_child">За всяко дете (1:1)</SelectItem>
                  <SelectItem value="per_station">Споделено на станция (1 per Station)</SelectItem>
                  <SelectItem value="ratio">Пропорционално (Скалируемо)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(allocationType === "ratio" || allocationType === "per_station" || allocationType === "per_child") && (
              <div className="space-y-2">
                <Label>Коефициент (Multiplier/Ratio)</Label>
                <Input
                  type="number"
                  step={0.1}
                  value={ratioValue}
                  onChange={(e) => setRatioValue(e.target.value ? Number(e.target.value) : "")}
                  placeholder={
                    allocationType === "per_child" ? "Напр. 2 (2 пера на дете)" :
                    allocationType === "per_station" ? "Напр. 4 (4 конуса на станция)" :
                    "Напр. 0.5 (1 топка на 2 деца)"
                  }
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
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Запази
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
