import type { AllocationType } from "@/types/inventory.types";

export type InventorySectionId = "all" | "per-child" | "per-station" | "ratio";

export interface InventorySectionConfig {
  id: InventorySectionId;
  label: string;
  /** Празен низ = индексна секция (/inventory). */
  pathSuffix: string;
  tooltip: string;
  allocationType: AllocationType | null;
}

export const INVENTORY_SECTIONS: readonly InventorySectionConfig[] = [
  {
    id: "all",
    label: "Всички уреди",
    pathSuffix: "",
    tooltip: "Цялото клубно оборудване",
    allocationType: null,
  },
  {
    id: "per-child",
    label: "На дете",
    pathSuffix: "per-child",
    tooltip: "Оборудване, разпределяно по 1:1 на дете",
    allocationType: "per_child",
  },
  {
    id: "per-station",
    label: "На станция",
    pathSuffix: "per-station",
    tooltip: "Споделено оборудване на станция",
    allocationType: "per_station",
  },
  {
    id: "ratio",
    label: "Пропорционално",
    pathSuffix: "ratio",
    tooltip: "Оборудване със скалируем коефициент",
    allocationType: "ratio",
  },
] as const;

export function getInventorySectionHref(id: InventorySectionId): string {
  const section = INVENTORY_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix
    ? `/inventory/${section.pathSuffix}`
    : "/inventory";
}

export function getActiveInventorySectionId(
  pathname: string
): InventorySectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/inventory") return "all";
  if (!normalized.startsWith("/inventory/")) return null;
  const segment = normalized.slice("/inventory/".length).split("/")[0];
  const match = INVENTORY_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}
