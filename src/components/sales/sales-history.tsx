
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { getSalesByMemberId } from '@/services/sales-service';
import { Sale } from '@/types';
import { Button } from '@/components/ui/button'; // Using Button for consistency

interface SalesHistoryProps {
  memberId: string;
}

export function SalesHistory({ memberId }: SalesHistoryProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Initialize router

  useEffect(() => {
    if (memberId) {
      getSalesByMemberId(memberId)
        .then(data => {
          setSales(data);
        })
        .catch(err => {
          console.error(err);
          setError('Грешка при зареждане на историята на покупките.');
        })
        .finally(() => setLoading(false));
    }
  }, [memberId]);

  if (loading) return <div className="p-4 text-center">Зареждане на история...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">История на покупките</h2>
        {sales.length === 0 ? (
            <p className="text-center text-gray-500">Няма регистрирани покупки.</p>
        ) : (
            <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Артикули</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Обща сума</th>
                             <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Преглед</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {sales.map(sale => (
                            <tr key={sale.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.date).toLocaleDateString('bg-BG')}</td>
                                <td className="px-6 py-4 whitespace-normal">
                                    {sale.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">{sale.total.toFixed(2)} {sale.currency || 'EUR'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                   <Button variant="link" onClick={() => router.push(`/sales/${sale.id}`)}>
                                       Разписка
                                   </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
}
