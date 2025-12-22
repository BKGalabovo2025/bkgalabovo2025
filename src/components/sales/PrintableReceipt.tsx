'use client';

import React from 'react';
import Image from 'next/image';
import { Sale, Member } from '@/types';
import { clubInfo } from '@/config/club';

interface PrintableReceiptProps {
  sale: Sale;
  member: Member | null;
}

// This component is purely for printing. It contains only the receipt's markup.
export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ sale, member }) => {
  if (!sale) return null;

  const isDeferred = sale.paymentStatus === 'deferred';
  const receiptTitle = isDeferred ? 'ПРОФОРМА СТОКОВА РАЗПИСКА' : 'СТОКОВА РАЗПИСКА';
  const statusText = isDeferred ? 'НЕПЛАТЕНО' : 'ПЛАТЕНО';
  const statusColor = isDeferred ? 'text-red-600' : 'text-green-600';
  const footerText = isDeferred
    ? 'Това е проформа документ, който не удостоверява плащане. Той служи за целите на бъдещо плащане.'
    : 'Този документ удостоверява извършено плащане и служи като касова бележка.';


  return (
    <div className="bg-white p-8">
        <header className="flex justify-between items-start pb-6 border-b-2 border-border">
            <div className="flex items-center gap-4">
                <Image src="/logo.png" alt="Club Logo" width={60} height={60} />
            </div>
            <div className="text-right">
                <h1 className="text-3xl font-bold tracking-wider">{receiptTitle}</h1>
                <p className="text-sm text-muted-foreground mt-1">№ {sale.id.substring(0, 8)} / {new Date(sale.date).toLocaleDateString('bg-BG')}</p>
            </div>
        </header>
        
        <section className="mt-8 grid grid-cols-2 gap-8">
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">ИЗДАЛ:</h2>
                <p className="font-bold mt-2">{clubInfo.name}</p>
                <p className="text-sm text-muted-foreground">{clubInfo.address}</p>
                <p className="text-sm text-muted-foreground">тел: {clubInfo.contact}</p>
                <p className="text-sm text-muted-foreground">e-mail: {clubInfo.email}</p>
                <p className="text-sm text-muted-foreground">{clubInfo.website}</p>
            </div>
            <div className="text-right">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">ПОЛУЧАТЕЛ:</h2>
                {member ? (
                    <>
                        <p className="font-bold mt-2">{member.firstName} {member.lastName}</p>
                        <p className="text-sm text-muted-foreground">Редовен член на клуба</p>
                    </>
                ) : (
                    <p className="font-bold mt-2">Външен клиент</p>
                )}
            </div>
        </section>

        <div className={`mt-8 text-center text-3xl font-bold ${statusColor}`}>
            {statusText}
        </div>

        <section className="mt-10">
            <table className="w-full text-sm">
                <thead className="border-b border-border">
                    <tr>
                        <th className="text-left font-semibold text-muted-foreground p-2">Артикул</th>
                        <th className="text-center font-semibold text-muted-foreground p-2">Кол.</th>
                        <th className="text-right font-semibold text-muted-foreground p-2">Ед. цена</th>
                        <th className="text-right font-semibold text-muted-foreground p-2">Общо</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item) => (
                        <tr key={item.productId}>
                            <td className="p-2 font-medium">{item.name}</td>
                            <td className="text-center p-2">{item.quantity}</td>
                            <td className="text-right p-2">{(item.price || 0).toFixed(2)} лв.</td>
                            <td className="text-right p-2">{((item.quantity || 0) * (item.price || 0)).toFixed(2)} лв.</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="border-t-2 border-border">
                    <tr>
                        <td colSpan={3} className="text-right p-3 font-bold text-foreground">ОБЩО ЗА ПЛАЩАНЕ:</td>
                        <td className="text-right p-3 font-bold text-lg">{(sale.total || 0).toFixed(2)} лв.</td>
                    </tr>
                </tfoot>
            </table>
        </section>
        <section className="mt-20 grid grid-cols-2 gap-8 text-center">
            <div>
                <p className="text-sm text-muted-foreground">Издал:</p>
                <p className="text-sm mt-1">(Подпис и печат)</p>
                <p className="mt-8">/СНЦ "Бадминтон клуб Гълъбово"/</p>
            </div>
            <div>
                    <p className="text-sm text-muted-foreground">Получил:</p>
                    <p className="text-sm mt-1">(Подпис)</p>
                    <p className="mt-8">/{member ? `${member.firstName} ${member.lastName}` : '................................'}/</p>
            </div>
        </section>
        <footer className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            <p>Настоящият документ се издава в два еднообразни екземпляра - по един за всяка от страните.</p>
            <p>{footerText}</p>
        </footer>
    </div>
  );
};
