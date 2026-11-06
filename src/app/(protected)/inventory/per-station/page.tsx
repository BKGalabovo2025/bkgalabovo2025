import type { Metadata } from "next";

import InventoryClient from "../inventory-client";

export const metadata: Metadata = {
  title: "Оборудване на станция | Инвентар",
  description: "Споделено оборудване, разпределяно на станция.",
};

export default function Page() {
  return <InventoryClient section="per-station" />;
}
