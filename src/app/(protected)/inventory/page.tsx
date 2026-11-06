import type { Metadata } from "next";

import InventoryClient from "./inventory-client";

export const metadata: Metadata = {
  title: "Инвентар и Оборудване | БК Гълъбово",
  description:
    "Цялото клубно оборудване с правила за разпределение по станции.",
};

export default function Page() {
  return <InventoryClient section="all" />;
}
