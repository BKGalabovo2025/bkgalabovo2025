
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSaleById } from '@/services/sales-service';
import { Sale } from '@/types';
import { Button } from '@/components/ui/button';

// Добавяме стилове, които се прилагат само при принтиране
const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      body * {
        visibility: hidden;
      }
      #receipt-section, #receipt-section * {
        visibility: visible;
      }
      #receipt-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .no-print {
        display: none;
      }
    }
  `}</style>
);

export default function ReceiptPage() {
  const params = useParams();
  const saleId = params.id as string;
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saleId) {
      getSaleById(saleId)
        .then(data => {
          if (data) {
            setSale(data);
          } else {
            setError('Продажбата не е намерена.');
          }
        })
        .catch(err => {
          console.error(err);
          setError('Възникна грешка при зареждането на продажбата.');
        })
        .finally(() => setLoading(false));
    }
  }, [saleId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div>Зареждане на бележка...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!sale) return <div>Продажбата не е намерена.</div>;

  return (
    <>
      <PrintStyles />
      <div className="max-w-2xl mx-auto p-4">
        <div id="receipt-section" className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Касова Бележка</h1>
            <p className="text-gray-500">Бадминтон Клуб Галабово</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p><strong>Номер на продажба:</strong> #{sale.id.substring(0, 8)}</p>
              <p><strong>Дата:</strong> {new Date(sale.date).toLocaleString('bg-BG')}</p>
            </div>
            <div className='text-right'>
                <p><strong>Клиент:</strong></p>
                <p>{sale.customerName}</p>
            </div>
          </div>

          <table className="w-full mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Артикул</th>
                <th className="text-center py-2">Кол.</th>
                <th className="text-right py-2">Ед. цена</th>
                <th className="text-right py-2">Общо</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map(item => (
                <tr key={item.productId} className="border-b">
                  <td className="py-2">{item.name}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">{item.price.toFixed(2)} лв.</td>
                  <td className="text-right py-2">{(item.price * item.quantity).toFixed(2)} лв.</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right">
            <p className="text-xl font-bold">Общо: {sale.totalAmount.toFixed(2)} лв.</p>
          </div>
        </div>

        <div className="text-center mt-6 no-print">
          <Button onClick={handlePrint}>Принтирай</Button>
        </div>
      </div>
    </>
  );
}
