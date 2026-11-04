import { Metadata } from "next";

import ClubServicesCatalogPage from "../club-services/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Клубни услуги & Наеми | Каталози - БК Гълъбово",
  description:
    "Каталог за допълнителни клубни услуги — шкафчета, наем на ракети, наплитане и консумативи.",
};

export default function GeneralServicesAliasPage() {
  return <ClubServicesCatalogPage />;
}
