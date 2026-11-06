import type { Metadata } from "next";

import InventoryClient from "../inventory-client";

export const metadata: Metadata = {
  title: "Оборудване на дете | Инвентар",
  description: "Оборудване, разпределяно по 1:1 на дете.",
};

export default function Page() {
  return <InventoryClient section="per-child" />;
}
