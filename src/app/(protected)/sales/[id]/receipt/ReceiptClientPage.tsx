'use client';

import { useState, useEffect } from 'react';
import { Printer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clubInfo } from '@/config/club';
import { getReceiptDetails, ReceiptDetails } from '@/services/sales-service'; // Import the new function and type
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ReceiptClientPageProps {
    saleId: string; // Receive only the ID
}

// Main Component for the Receipt Page
export default function ReceiptClientPage({ saleId }: ReceiptClientPageProps) {
    const [details, setDetails] = useState<ReceiptDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const fetchedDetails = await getReceiptDetails(saleId);
                if (!fetchedDetails) {
                    setError(`Не могат да бъдат заредени данните за квитанция с номер ${saleId}.`);
                } else {
                    setDetails(fetchedDetails);
                }
            } catch (err: any) {
                console.error("Error fetching receipt details:", err);
                setError(err.message || 'Възникна неочаквана грешка.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [saleId]);

    // Loading State
    if (loading) {
        return <ReceiptSkeleton />;
    }

    // Error State
    if (error || !details) {
        return <ErrorDisplay message={error || 'Данните за квитанцията не са намерени.'} />
    }

    // Success State
    const { sale, member, service, subscription } = details;
    const fullName = [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
    const memberAddress = member.address || 'Няма предоставен адрес';

    return (
        <>
            <style jsx global>{`
                @media print { ... }
            `}</style>

            <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 font-sans printable-area">
                <div className="flex justify-between items-center mb-8 no-print">
                    <h1 className="text-2xl font-bold">Преглед на квитанция</h1>
                    <Button onClick={() => window.print()} variant="default">
                        <Printer className="mr-2 h-4 w-4" />
                        Принтирай
                    </Button>
                </div>
                
                {/* Receipt Content using details */}
                <div className="border border-gray-300 p-8">
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
                    {/* ... Rest of the receipt JSX ... */}
                </div>
            </div>
        </>
    );
}

// Helper components for loading and error states
const ReceiptSkeleton = () => (
    <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-28" />
        </div>
        <div className="border p-8 space-y-8">
            <div className="flex justify-between items-start"><Skeleton className="h-20 w-1/2" /><Skeleton className="h-12 w-1/3" /></div>
            <div className="grid grid-cols-2 gap-8"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
            <Skeleton className="h-32 w-full" />
            <div className="flex justify-end"><Skeleton className="h-40 w-1/3" /></div>
        </div>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="max-w-4xl mx-auto p-8">
        <Alert variant="destructive">
             <AlertCircle className="h-4 w-4" />
            <AlertTitle>Грешка</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    </div>
);
