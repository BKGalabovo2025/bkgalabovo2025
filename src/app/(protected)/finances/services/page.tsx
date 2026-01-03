
import { adminDb } from '@/lib/firebase-admin'; // Using Admin SDK
import { DataTable } from '@/components/shared/data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Service {
    id: string;
    name: string;
    price: number; 
    currency: string;
    type: string;
    billingPeriod?: string;
}

// Async function to fetch data using the Admin SDK
async function getServices(): Promise<Service[]> {
    const servicesCollection = adminDb.collection('clubServices');
    const querySnapshot = await servicesCollection.get();

    const services = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert price from cents to the main unit for display
        const priceInMainUnit = (data.price || 0) / 100;

        return {
            id: doc.id,
            name: data.name || 'N/A',
            price: priceInMainUnit,
            currency: data.currency || 'BGN',
            type: data.type || 'Unknown',
            billingPeriod: data.billingPeriod || 'N/A',
        };
    });

    return services;
}

export default async function ServicesPage() {
  // Adding a try-catch block for better error handling on the server
  let data: Service[] = [];
  let error: string | null = null;
  try {
    data = await getServices();
  } catch (e) {
    console.error("Failed to fetch services:", e);
    error = "Неуспешно зареждане на услугите. Проверете сървърните логове.";
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Услуги</h1>
            <Button asChild>
                <Link href="/finances/services/new">Добави нова услуга</Link>
            </Button>
        </div>
      <DataTable 
        columns={columns} 
        data={data}
        filterColumnId="name" 
        filterPlaceholder="Филтриране по име..."
        isLoading={false} // Data is pre-fetched on the server
        emptyStateMessage="Няма намерени услуги." 
      />
    </div>
  );
}
