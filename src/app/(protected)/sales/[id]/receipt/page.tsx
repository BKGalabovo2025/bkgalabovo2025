
import { getSaleById } from '@/services/sales-service';
import { getMemberById } from '@/services/member-service';
import { getClubServiceById, getSubscriptionsByMemberId } from '@/services/subscription-service';
import ReceiptClientPage from './ReceiptClientPage';
import { AlertCircle } from 'lucide-react';

interface ReceiptPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
    // CORRECTED: Await the params promise to resolve before accessing its properties.
    const resolvedParams = await params;
    const saleId = resolvedParams.id;

    try {
        const sale = await getSaleById(saleId);
        if (!sale) {
            return <ErrorDisplay message={`Продажба с ID ${saleId} не е намерена.`} />;
        }

        if (!sale.memberId) {
            return <ErrorDisplay message="Продажбата не е свързана с член." />;
        }

        const [member, memberSubscriptions] = await Promise.all([
            getMemberById(sale.memberId),
            getSubscriptionsByMemberId(sale.memberId)
        ]);

        if (!member) {
            return <ErrorDisplay message={`Член с ID ${sale.memberId} не е намерен.`} />;
        }
        
        const subscription = memberSubscriptions.find(sub => sub.id === sale.subscriptionId);

        if (!subscription) {
            return <ErrorDisplay message={`Свързан абонамент (ID: ${sale.subscriptionId}) не е намерен за този член.`} />;
        }

        if (!subscription.serviceId) {
            return <ErrorDisplay message="Абонаментът не е свързан с услуга." />;
        }

        const service = await getClubServiceById(subscription.serviceId);
        if (!service) {
            return <ErrorDisplay message={`Услуга с ID ${subscription.serviceId} не е намерена.`} />;
        }

        return <ReceiptClientPage sale={sale} member={member} service={service} subscription={subscription} />;

    } catch (error) {
        console.error("Error fetching receipt data:", error);
        const errorMessage = error instanceof Error ? error.message : 'Възникна неочаквана грешка';
        return <ErrorDisplay message={errorMessage} />;
    }
}

const ErrorDisplay = ({ message }: { message: string }) => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-destructive">
            <AlertCircle className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Грешка при генериране на квитанция</h2>
            <p>{message}</p>
        </div>
    );
};
