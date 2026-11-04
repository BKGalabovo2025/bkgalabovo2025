import { Metadata } from "next";

import { ClubServicesCatalogView } from "@/components/catalogs/views/ClubServicesCatalogView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Клубни услуги & Наеми | Каталози - БК Гълъбово",
  description:
    "Каталог за допълнителни клубни услуги — шкафчета, наем на ракети, наплитане и консумативи.",
};

export default function ClubServicesCatalogPage() {
  return <ClubServicesCatalogView />;
}
