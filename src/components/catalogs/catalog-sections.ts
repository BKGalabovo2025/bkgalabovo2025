import { Activity, Dumbbell, Package, Wrench } from "lucide-react";

export type CatalogSectionId =
  "trainings" | "club-services" | "recovery" | "shop";

export interface CatalogSectionConfig {
  id: CatalogSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof Dumbbell;
}

export const CATALOG_SECTIONS: readonly CatalogSectionConfig[] = [
  {
    id: "trainings",
    label: "Тренировки & Абонаменти",
    pathSuffix: "trainings",
    tooltip:
      "Каталог на тренировъчни програми, абонаментни карти и индивидуални часове",
    icon: Dumbbell,
  },
  {
    id: "club-services",
    label: "Клубни услуги & Наеми",
    pathSuffix: "club-services",
    tooltip:
      "Наем на шкафчета, ракети, наплитане на кордаж и други допълнителни услуги",
    icon: Wrench,
  },
  {
    id: "recovery",
    label: "Възстановяване (Recovery)",
    pathSuffix: "recovery",
    tooltip:
      "Сауна, криотерапия, масажи и специализирани пакети в Recovery Zone",
    icon: Activity,
  },
  {
    id: "shop",
    label: "Клубен магазин & Стоки",
    pathSuffix: "shop",
    tooltip:
      "Ракети, пера, грипове, облекло, добавки и консумативи с наличности",
    icon: Package,
  },
] as const;

export function getActiveCatalogSectionId(
  pathname: string
): CatalogSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Base /catalogs path defaults to "trainings"
  if (normalized === "/catalogs") {
    return "trainings";
  }

  if (!normalized.startsWith("/catalogs/")) {
    return null;
  }

  const remainder = normalized.slice("/catalogs/".length).split("/")[0];

  // Map backward compatibility aliases
  if (remainder === "services") return "trainings";
  if (remainder === "general") return "club-services";
  if (remainder === "inventory") return "shop";

  const match = CATALOG_SECTIONS.find((s) => s.pathSuffix === remainder);
  return match ? match.id : null;
}
