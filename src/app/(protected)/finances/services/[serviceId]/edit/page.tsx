'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import ServiceForm from './ServiceForm';
import { Loader2 } from 'lucide-react';
import { getActivePrices } from '@/services/price-service';
import { Price } from '@/types';

// --- Type Definition ---
interface Service {
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
    type: string;
    billingPeriod?: string;
    targetGroups?: string[];
    grantsLicense?: boolean;
    licenseCondition?: string;
    licensePaymentCount?: number;
    grantsApparel?: boolean;
    apparelCondition?: string;
    apparelPaymentCount?: number;
    durationMinutes?: number;
    priceId?: string;
}

// --- Page Component (Client Component) ---
export default function EditServicePage() {
    const params = useParams();
    const serviceId = params.serviceId as string;
    const [service, setService] = useState<Service | null>(null);
    const [activePrices, setActivePrices] = useState<Price[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!serviceId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const serviceResponse = await fetch(`/api/services/${serviceId}`);
                if (!serviceResponse.ok) {
                    throw new Error('Failed to fetch service');
                }
                const serviceData = await serviceResponse.json();
                
                const pricesData = await getActivePrices();

                setService(serviceData);
                setActivePrices(pricesData);
            } catch (err) {
                setError(true);
                console.error(err);
            }
            setLoading(false);
        };

        fetchData();
    }, [serviceId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        notFound();
    }

    if (!service) {
        return null; // Or some other placeholder
    }

    return <ServiceForm service={service} activePrices={activePrices} />;
}
