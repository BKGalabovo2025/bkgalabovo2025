import { Metadata } from "next";

import ShopCatalogPage from "../shop/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Клубен магазин & Стоки | Каталози - БК Гълъбово",
  description:
    "Наличности, цени и детайли за ракети, пера, грипове, спортно облекло и аксесоари.",
};

export default function InventoryAliasPage() {
  return <ShopCatalogPage />;
}
