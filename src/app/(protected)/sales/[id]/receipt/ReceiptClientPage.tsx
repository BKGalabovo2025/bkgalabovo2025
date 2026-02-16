'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clubInfo } from '@/config/club'; // Assuming club info is here
import { Sale, Member, ClubService, Subscription } from '@/types';

interface ReceiptClientPageProps {
    sale: Sale;
    member: Member;
    service: ClubService;
    subscription: Subscription;
}

// Main Component for the Receipt Page
export default function ReceiptClientPage({ sale, member, service, subscription }: ReceiptClientPageProps) {

    const fullName = [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
    const memberAddress = member.address || 'Няма предоставен адрес';

    return (
        <>
            {/* Print-specific styles */}
            <style jsx global>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        margin: 0;
                    }
                }
            `}</style>

            <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 font-sans printable-area">
                {/* Header with Print Button */}
                <div className="flex justify-between items-center mb-8 no-print">
                    <h1 className="text-2xl font-bold">Преглед на квитанция</h1>
                    <Button onClick={() => window.print()} variant="default">
                        <Printer className="mr-2 h-4 w-4" />
                        Принтирай
                    </Button>
                </div>
                
                {/* Receipt Content */}
                <div className="border border-gray-300 p-8">
                    {/* 1. Document Header */}
                    <header className="flex justify-between items-start pb-6 border-b-2 border-gray-500">
                        <div className="flex items-center">
                            <img src="/logo.png" alt="Лого на клуба" className="h-20 w-20 mr-4" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{clubInfo.name}</h2>
                                <p className="text-xs text-gray-600">{clubInfo.address}</p>
                                <p className="text-xs text-gray-600">{clubInfo.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-4xl font-bold text-gray-800 tracking-wider">КВИТАНЦИЯ</h1>
                            <p className="text-sm text-gray-600 mt-2">Номер: {sale.id.substring(0, 8).toUpperCase()}</p>
                            <p className="text-sm text-gray-600">Дата: {new Date(sale.saleDate).toLocaleDateString('bg-BG')}</p>
                        </div>
                    </header>

                    {/* 2. Supplier and Client Information */}
                    <section className="grid grid-cols-2 gap-8 my-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Доставчик</h3>
                            <p className="font-bold">{clubInfo.name}</p>
                            <p className="text-sm text-gray-700">{clubInfo.address}</p>
                            <p className="text-sm text-gray-700">{clubInfo.email}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Получател</h3>
                            <p className="font-bold">{fullName}</p>
                            <p className="text-sm text-gray-700">{memberAddress}</p>
                        </div>
                    </section>

                    {/* 3. Items Table */}
                    <section className="my-10">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-sm font-semibold uppercase">Описание</th>
                                    <th className="p-3 text-sm font-semibold uppercase text-right">Период на абонамент</th>
                                    <th className="p-3 text-sm font-semibold uppercase text-right">Сума</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="p-3 font-medium">{service.name}</td>
                                    <td className="p-3 text-right">{`${new Date(subscription.startDate).toLocaleDateString('bg-BG')} - ${new Date(subscription.endDate).toLocaleDateString('bg-BG')}`}</td>
                                    <td className="p-3 text-right">{(sale.totalAmount / 100).toFixed(2)} {sale.currency}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* 4. Totals Section */}
                    <section className="flex justify-end my-8">
                        <div className="w-full max-w-xs text-right">
                            <div className="flex justify-between py-2 border-b">
                                <span className="font-semibold text-gray-600">Междинна сума:</span>
                                <span>{(sale.totalAmount / 100).toFixed(2)} {sale.currency}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="font-semibold text-gray-600">ДДС (0%):</span>
                                <span>0.00 {sale.currency}</span>
                            </div>
                            <div className="flex justify-between py-3 bg-gray-100 px-4 mt-4 rounded-md">
                                <span className="font-bold text-lg">ОБЩО:</span>
                                <span className="font-bold text-lg">{(sale.totalAmount / 100).toFixed(2)} {sale.currency}</span>
                            </div>
                        </div>
                    </section>

                    {/* 5. Signature Section */}
                    <footer className="mt-16 pt-8 border-t-2 border-gray-200">
                        <div className="grid grid-cols-2 gap-8 text-center">
                            <div>
                                <p className="text-sm text-gray-600">....................................................</p>
                                <p className="text-sm font-semibold mt-1">Съставил</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">....................................................</p>
                                <p className="text-sm font-semibold mt-1">Получил</p>
                            </div>
                        </div>
                        <div className="text-center text-xs text-gray-500 mt-12">
                            <p>Този документ е генериран автоматично и е валиден без подпис и печат.</p>
                            <p>Благодарим Ви, че избрахте {clubInfo.name}!</p>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
