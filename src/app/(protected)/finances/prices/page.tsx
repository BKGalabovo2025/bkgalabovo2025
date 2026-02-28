
// src/app/(protected)/finances/prices/page.tsx

import { getAllPrices } from "@/services/price-service";
import { PricesClientPage } from './client-page';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export default async function PricesPage() {
  const prices = await getAllPrices();

  return (
    <div className="container mx-auto p-4">
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Начало</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink href="/finances">Финанси</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Управление на цени</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-3xl font-bold mb-6">Управление на цени</h1>
        <p className="text-muted-foreground mb-8">Тук можете да преглеждате и актуализирате цените за всички услуги и абонаменти в клуба. Всяка промяна се записва в история, за да се осигури пълна проследяемост.</p>

        <PricesClientPage initialPrices={prices} />
    </div>
  );
}
