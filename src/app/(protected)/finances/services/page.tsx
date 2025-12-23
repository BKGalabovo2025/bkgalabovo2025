
import { promises as fs } from 'fs';
import path from 'path';
import { ClubService } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Временна функция за четене на услугите от JSON файла
async function getServices(): Promise<ClubService[]> {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'services.json');
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent) as ClubService[];
  } catch (error) {
    // Ако файлът не съществува, връщаме празен списък
    return [];
  }
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление на услуги</h1>
        <Link href="/finances/services/new" passHref>
          <Button>Добави нова услуга</Button>
        </Link>
      </div>

      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                <CardDescription>{service.type} | {service.targetGroups.join(', ')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(service.price / 100).toFixed(2)} {service.currency}</p>
                {service.billingPeriod && <p className="text-sm text-gray-500">Таксуване: {service.billingPeriod}</p>}
                <div className="mt-4 pt-4 border-t">
                  {service.grantsLicense && <p className="text-sm">✓ Право на картотека</p>}
                  {service.grantsApparel && <p className="text-sm">✓ Право на екипировка</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-dashed border-2 rounded-lg">
          <p className="text-gray-500">Все още няма добавени услуги.</p>
          <p className="text-gray-400 mt-2">Натиснете бутона "Добави нова услуга", за да започнете.</p>
        </div>
      )}
    </div>
  );
}
