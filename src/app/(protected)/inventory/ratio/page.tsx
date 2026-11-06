import type { Metadata } from "next";

import InventoryClient from "../inventory-client";

export const metadata: Metadata = {
  title: "Пропорционално оборудване | Инвентар",
  description: "Оборудване със скалируем коефициент на разпределение.",
};

export default function Page() {
  return <InventoryClient section="ratio" />;
}
